import Image from "next/image";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/blog/BlockRenderer";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { localizeCopy } from "@/lib/content";
import { formatDate } from "@/lib/formatters";
import { buildMetadata } from "@/lib/metadata";
import { getBlogPostBySlug } from "@/services/blog.service";

type BlogDetailPageProps = {
  params: Promise<{ locale: AppLocale; slug: string }>;
};

export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { locale, slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {};
  }

  return buildMetadata({
    locale,
    title: `DevJR | ${localizeCopy(post.title, locale)}`,
    description: localizeCopy(post.excerpt, locale),
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { locale, slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const tBlog = await getTranslations({ locale, namespace: "blog" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <PageShell className="space-y-16">
      {post.coverImageUrl ? (
        <div className="relative h-[280px] overflow-hidden rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] md:h-[420px]">
          <Image
            src={post.coverImageUrl}
            alt={localizeCopy(post.title, locale)}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="space-y-4">
        <Link
          href="/blog"
          locale={locale}
          className="text-sm text-[hsl(var(--muted-foreground))]"
        >
          {tCommon("common.backToBlog")}
        </Link>

        <PageHero
          eyebrow={tBlog("detail.eyebrow")}
          title={localizeCopy(post.title, locale)}
          description={localizeCopy(post.excerpt, locale)}
          aside={
            <>
              <Surface variant="elevated" className="p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  {tBlog("detail.published")}
                </p>
                <p className="mt-3 text-lg font-semibold">
                  {formatDate(post.publishedAt, locale)}
                </p>
              </Surface>
              <Surface variant="elevated" className="p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  {tBlog("detail.readTime")}
                </p>
                <p className="mt-3 text-lg font-semibold">{post.readTime}</p>
              </Surface>
              {post.authorUsername ? (
                <Surface variant="elevated" className="p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                    Author
                  </p>
                  <p className="mt-3 text-lg font-semibold">
                    @{post.authorUsername}
                  </p>
                  {post.authorFullName ? (
                    <p className="mt-2 text-sm text-[hsl(var(--foreground-soft))]">
                      {post.authorFullName}
                    </p>
                  ) : null}
                </Surface>
              ) : null}
            </>
          }
        />
      </div>

      {post.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag.id}>{localizeCopy(tag.name, locale)}</Badge>
          ))}
        </div>
      ) : null}

      <article>
        <Surface className="p-6 md:p-8">
          <BlockRenderer content={post.content} />
        </Surface>
      </article>
    </PageShell>
  );
}
