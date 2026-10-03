"use client";

import { cloneElement, isValidElement, useRef, useState, useTransition } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlockEditor, type BlockEditorHandle } from "@/components/editor/BlockEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createEmptyBlogContentDocument, parseBlogContentJson, stringifyBlogContentDocument } from "@/features/blog/lib/block-content";
import { ApiError } from "@/services/http/api-error";
import type { Tag } from "@/types/common";
import type { BlogPostDetailDto } from "@/features/blog/types/blog.dto";
import type {
  BlogFormValues,
  UpsertBlogPostRequestDto,
} from "@/features/blog/types/blog-admin";

type FormErrors = Partial<Record<keyof BlogFormValues, string>>;

function buildInitialValues(post?: BlogPostDetailDto): BlogFormValues {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    contentJson:
      post?.contentJson ?? stringifyBlogContentDocument(createEmptyBlogContentDocument()),
    coverImageUrl: post?.coverImageUrl ?? "",
    published: post?.published ?? true,
    publishedAt: toDateTimeLocalValue(post?.publishedAt ?? null),
    tagIds: post?.tags.map((tag) => tag.id) ?? [],
  };
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function validate(values: BlogFormValues) {
  const errors: FormErrors = {};

  if (!values.title.trim()) errors.title = "Title is required.";
  if (!values.slug.trim()) errors.slug = "Slug is required.";
  if (!values.excerpt.trim()) errors.excerpt = "Excerpt is required.";
  const content = parseBlogContentJson(values.contentJson);
  const hasBlocks = content.blocks.some((block) => {
    switch (block.type) {
      case "paragraph":
        return block.data.text.trim().length > 0;
      case "header":
        return block.data.text.trim().length > 0;
      case "code":
        return block.data.code.trim().length > 0;
      case "image":
        return Boolean((block.data.file?.url ?? block.data.url)?.trim());
      case "list":
        return block.data.items.length > 0;
      default:
        return false;
    }
  });

  if (!hasBlocks) {
    errors.contentJson = "Content is required.";
  }

  if (values.coverImageUrl.trim() && !isValidUrl(values.coverImageUrl.trim())) {
    errors.coverImageUrl = "Cover image must be a valid URL.";
  }
  if (values.publishedAt.trim() && Number.isNaN(new Date(values.publishedAt).getTime())) {
    errors.publishedAt = "Publication date is invalid.";
  }

  return errors;
}

function toPayload(values: BlogFormValues): UpsertBlogPostRequestDto {
  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    excerpt: values.excerpt.trim(),
    contentJson: values.contentJson.trim(),
    coverImageUrl: values.coverImageUrl.trim() || null,
    published: values.published,
    publishedAt: values.publishedAt.trim()
      ? new Date(values.publishedAt).toISOString()
      : null,
    tagIds: values.tagIds,
  };
}

export function BlogForm({
  mode,
  tags,
  post,
}: {
  mode: "create" | "edit";
  tags: Tag[];
  post?: BlogPostDetailDto;
}) {
  const router = useRouter();
  const editorRef = useRef<BlockEditorHandle | null>(null);
  const initialEditorValueRef = useRef(
    post?.contentJson ?? stringifyBlogContentDocument(createEmptyBlogContentDocument()),
  );
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<BlogFormValues>(() =>
    buildInitialValues(post),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function setValue<K extends keyof BlogFormValues>(
    field: K,
    value: BlogFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function toggleTag(tagId: string) {
    setValues((current) => ({
      ...current,
      tagIds: current.tagIds.includes(tagId)
        ? current.tagIds.filter((item) => item !== tagId)
        : [...current.tagIds, tagId],
    }));
  }

  function mapApiErrors(error: ApiError): FormErrors {
    return {
      title: error.errors?.Title?.[0],
      slug: error.errors?.Slug?.[0],
      excerpt: error.errors?.Excerpt?.[0],
      contentJson: error.errors?.ContentJson?.[0],
      coverImageUrl: error.errors?.CoverImageUrl?.[0],
      publishedAt: error.errors?.PublishedAt?.[0],
    };
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
            Blog
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            {mode === "create" ? "Create post" : "Edit post"}
          </h2>
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            const nextErrors = validate(values);
            setErrors(nextErrors);
            setFormError(null);

            if (Object.keys(nextErrors).length > 0) {
              return;
            }

            startTransition(async () => {
              let nextContentJson = values.contentJson;

              try {
                nextContentJson = await editorRef.current?.save() ?? values.contentJson;
              } catch {
                setErrors((current) => ({
                  ...current,
                  contentJson: "Unable to serialize editor content.",
                }));
                setFormError("Unable to save editor content.");
                return;
              }

              const nextValues = {
                ...values,
                contentJson: nextContentJson,
              };

              const response = await fetch(
                mode === "create" ? "/api/admin/blog" : `/api/admin/blog/${post?.id}`,
                {
                  method: mode === "create" ? "POST" : "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                  },
                  body: JSON.stringify(toPayload(nextValues)),
                },
              );

              if (!response.ok) {
                const payload = await response.json().catch(() => null);
                if (response.status === 401) {
                  router.replace("/admin/login");
                  router.refresh();
                  return;
                }

                const apiError = new ApiError(
                  payload?.message ?? "Unable to save blog post.",
                  response.status,
                  payload?.errors,
                );
                setErrors(mapApiErrors(apiError));
                setFormError(apiError.message);
                return;
              }

              router.push("/admin/blog");
              router.refresh();
            });
          }}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Field id="title" label="Title" error={errors.title}>
              <input
                value={values.title}
                onChange={(event) => setValue("title", event.target.value)}
                className="admin-input"
              />
            </Field>
            <Field id="slug" label="Slug" error={errors.slug}>
              <input
                value={values.slug}
                onChange={(event) => setValue("slug", event.target.value)}
                className="admin-input"
              />
            </Field>
          </div>

          <Field id="excerpt" label="Excerpt" error={errors.excerpt}>
            <textarea
              value={values.excerpt}
              onChange={(event) => setValue("excerpt", event.target.value)}
              className="admin-textarea"
              rows={3}
            />
          </Field>

          <div className="grid gap-6 md:grid-cols-2">
            <Field id="coverImageUrl" label="Cover image URL" error={errors.coverImageUrl}>
              <input
                value={values.coverImageUrl}
                onChange={(event) => setValue("coverImageUrl", event.target.value)}
                className="admin-input"
                placeholder="https://..."
              />
            </Field>

            <Field id="publishedAt" label="Published at" error={errors.publishedAt}>
              <input
                type="datetime-local"
                value={values.publishedAt}
                onChange={(event) => setValue("publishedAt", event.target.value)}
                className="admin-input"
              />
            </Field>
          </div>

          <Field label="Content" error={errors.contentJson}>
            <BlockEditor
              ref={editorRef}
              initialValue={initialEditorValueRef.current}
              onChange={(contentJson) => setValue("contentJson", contentJson)}
            />
          </Field>

          <fieldset className="space-y-3 border-0 p-0 m-0">
            <legend className="p-0 text-sm font-medium">Tags</legend>
            {tags.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                No tags available yet. Create them in{" "}
                <Link
                  href="/admin/tags"
                  className="font-medium text-[hsl(var(--accent-strong))]"
                >
                  Tags admin
                </Link>
                .
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] px-4 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={values.tagIds.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                    />
                    <span>{tag.name.en}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={values.published}
              onChange={(event) => setValue("published", event.target.checked)}
            />
            <span>Published</span>
          </label>

          {formError ? (
            <p className="rounded-xl border border-[hsl(var(--destructive))] bg-[hsla(var(--destructive),0.08)] px-4 py-3 text-sm text-[hsl(var(--destructive))]">
              {formError}
            </p>
          ) : null}

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save post"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/blog")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id?: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  const errorId = id ? `${id}-error` : undefined;
  const content =
    id && isValidElement(children)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          id,
          "aria-invalid": Boolean(error),
          "aria-describedby": error ? errorId : undefined,
        })
      : children;

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {content}
      {error ? (
        <span id={errorId} className="text-sm text-[hsl(var(--destructive))]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
