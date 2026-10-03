"use client";

import { cloneElement, isValidElement, useMemo, useState, useTransition } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ApiError } from "@/services/http/api-error";
import type { Tag } from "@/types/common";
import type { ProjectDetailDto } from "@/features/projects/types/project.dto";
import type {
  ProjectFormValues,
  UpsertProjectRequestDto,
} from "@/features/projects/types/project-admin";

type FormErrors = Partial<Record<keyof ProjectFormValues, string>>;

function buildInitialValues(project?: ProjectDetailDto): ProjectFormValues {
  return {
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    description: project?.description ?? "",
    content: project?.content ?? "",
    domain: project?.domain ?? "",
    coverImageUrl: project?.coverImageUrl ?? "",
    galleryImages: project?.galleryImages.join("\n") ?? "",
    stack: project?.stack.join(", ") ?? "",
    metrics: Object.entries(project?.metrics ?? {})
      .map(([key, value]) => `${key}:${value ?? ""}`)
      .join("\n"),
    repoUrl: project?.repoUrl ?? "",
    liveUrl: project?.liveUrl ?? "",
    videoUrl: project?.videoUrl ?? "",
    featured: project?.featured ?? false,
    published: project?.published ?? true,
    tagIds: project?.tags.map((tag) => tag.id) ?? [],
  };
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function validate(values: ProjectFormValues) {
  const errors: FormErrors = {};

  if (!values.title.trim()) errors.title = "Title is required.";
  if (!values.slug.trim()) errors.slug = "Slug is required.";
  if (!values.description.trim()) errors.description = "Description is required.";
  if (!values.content.trim()) errors.content = "Content is required.";
  if (!values.domain.trim()) errors.domain = "Domain is required.";
  if (values.coverImageUrl.trim() && !isValidUrl(values.coverImageUrl.trim())) {
    errors.coverImageUrl = "Cover image must be a valid URL.";
  }
  if (values.repoUrl.trim() && !isValidUrl(values.repoUrl.trim())) {
    errors.repoUrl = "Repository URL must be valid.";
  }
  if (values.liveUrl.trim() && !isValidUrl(values.liveUrl.trim())) {
    errors.liveUrl = "Live URL must be valid.";
  }
  if (values.videoUrl.trim() && !isValidUrl(values.videoUrl.trim())) {
    errors.videoUrl = "Video URL must be valid.";
  }
  const invalidGallery = values.galleryImages
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .some((item) => !isValidUrl(item));
  if (invalidGallery) {
    errors.galleryImages = "Each gallery item must be a valid URL.";
  }

  return errors;
}

function parseMetrics(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string | null>>((acc, line) => {
      const [key, ...valueParts] = line.split(":");
      const normalizedKey = key?.trim();

      if (!normalizedKey) {
        return acc;
      }

      const value = valueParts.join(":").trim();
      acc[normalizedKey] = value || null;
      return acc;
    }, {});
}

function toPayload(values: ProjectFormValues): UpsertProjectRequestDto {
  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    description: values.description.trim(),
    content: values.content.trim(),
    domain: values.domain.trim(),
    coverImageUrl: values.coverImageUrl.trim() || null,
    galleryImages: values.galleryImages
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    stack: values.stack
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    metrics: parseMetrics(values.metrics),
    repoUrl: values.repoUrl.trim() || null,
    liveUrl: values.liveUrl.trim() || null,
    videoUrl: values.videoUrl.trim() || null,
    featured: values.featured,
    published: values.published,
    tagIds: values.tagIds,
  };
}

export function ProjectForm({
  mode,
  tags,
  project,
}: {
  mode: "create" | "edit";
  tags: Tag[];
  project?: ProjectDetailDto;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<ProjectFormValues>(() =>
    buildInitialValues(project),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const heading = useMemo(
    () => (mode === "create" ? "Create project" : "Edit project"),
    [mode],
  );

  function setValue<K extends keyof ProjectFormValues>(
    field: K,
    value: ProjectFormValues[K],
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
      description: error.errors?.Description?.[0],
      content: error.errors?.Content?.[0],
      domain: error.errors?.Domain?.[0],
      coverImageUrl: error.errors?.CoverImageUrl?.[0],
      galleryImages: error.errors?.GalleryImages?.[0],
      repoUrl: error.errors?.RepoUrl?.[0],
      liveUrl: error.errors?.LiveUrl?.[0],
      videoUrl: error.errors?.VideoUrl?.[0],
    };
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
            Projects
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
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
              const response = await fetch(
                mode === "create"
                  ? "/api/admin/projects"
                  : `/api/admin/projects/${project?.id}`,
                {
                  method: mode === "create" ? "POST" : "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                  },
                  body: JSON.stringify(toPayload(values)),
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
                  payload?.message ?? "Unable to save project.",
                  response.status,
                  payload?.errors,
                );
                setErrors(mapApiErrors(apiError));
                setFormError(apiError.message);
                return;
              }

              router.push("/admin/projects");
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

          <Field id="description" label="Description" error={errors.description}>
            <textarea
              value={values.description}
              onChange={(event) => setValue("description", event.target.value)}
              className="admin-textarea"
              rows={3}
            />
          </Field>

          <div className="grid gap-6 md:grid-cols-2">
            <Field id="domain" label="Domain" error={errors.domain}>
              <input
                value={values.domain}
                onChange={(event) => setValue("domain", event.target.value)}
                className="admin-input"
              />
            </Field>
            <Field id="coverImageUrl" label="Cover image URL" error={errors.coverImageUrl}>
              <input
                value={values.coverImageUrl}
                onChange={(event) => setValue("coverImageUrl", event.target.value)}
                className="admin-input"
                placeholder="https://..."
              />
            </Field>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Stack (comma separated)">
              <input
                value={values.stack}
                onChange={(event) => setValue("stack", event.target.value)}
                className="admin-input"
              />
            </Field>
            <Field id="galleryImages" label="Gallery images (one URL per line)" error={errors.galleryImages}>
              <textarea
                value={values.galleryImages}
                onChange={(event) => setValue("galleryImages", event.target.value)}
                className="admin-textarea"
                rows={4}
                placeholder="https://..."
              />
            </Field>
          </div>

          <Field label="Metrics (one key:value per line)">
            <textarea
              value={values.metrics}
              onChange={(event) => setValue("metrics", event.target.value)}
              className="admin-textarea"
              rows={4}
            />
          </Field>

          <div className="grid gap-6 md:grid-cols-3">
            <Field id="repoUrl" label="Repository URL" error={errors.repoUrl}>
              <input
                value={values.repoUrl}
                onChange={(event) => setValue("repoUrl", event.target.value)}
                className="admin-input"
                placeholder="https://github.com/..."
              />
            </Field>
            <Field id="liveUrl" label="Live URL" error={errors.liveUrl}>
              <input
                value={values.liveUrl}
                onChange={(event) => setValue("liveUrl", event.target.value)}
                className="admin-input"
                placeholder="https://..."
              />
            </Field>
            <Field id="videoUrl" label="Video URL" error={errors.videoUrl}>
              <input
                value={values.videoUrl}
                onChange={(event) => setValue("videoUrl", event.target.value)}
                className="admin-input"
                placeholder="https://youtube.com/..."
              />
            </Field>
          </div>

          <Field id="content" label="Content" error={errors.content}>
            <textarea
              value={values.content}
              onChange={(event) => setValue("content", event.target.value)}
              className="admin-textarea"
              rows={10}
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

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={values.featured}
                onChange={(event) => setValue("featured", event.target.checked)}
              />
              <span>Featured</span>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={values.published}
                onChange={(event) => setValue("published", event.target.checked)}
              />
              <span>Published</span>
            </label>
          </div>

          {formError ? (
            <p className="rounded-xl border border-[hsl(var(--destructive))] bg-[hsla(var(--destructive),0.08)] px-4 py-3 text-sm text-[hsl(var(--destructive))]">
              {formError}
            </p>
          ) : null}

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save project"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/projects")}
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
