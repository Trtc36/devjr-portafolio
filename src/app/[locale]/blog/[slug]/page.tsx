import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { SectionShell } from "@/components/layout/section-shell";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { localizeCopy } from "@/lib/content";
import { formatDate } from "@/lib/formatters";
import { buildMetadata } from "@/lib/metadata";
import { getBlogPostBySlug, getBlogPosts } from "@/services/blog.service";

type BlogDetailPageProps = {
  params: Promise<{ locale: AppLocale; slug: string }>;
};

export function generateStaticParams() {
  return getBlogPosts().flatMap((post) =>
    (["en", "es"] as const).map((locale) => ({
      locale,
      slug: post.slug,
    })),
  );
}

export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { locale, slug } = await params;
  const post = getBlogPostBySlug(slug);

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
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const tBlog = await getTranslations({ locale, namespace: "blog" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <PageShell className="space-y-16">
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
            </>
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <Badge key={tag.id}>{localizeCopy(tag.name, locale)}</Badge>
        ))}
      </div>

      <article className="space-y-10">
        {post.sections.map((section) => (
          <SectionShell
            key={section.id}
            title={localizeCopy(section.title, locale)}
          >
            <Surface className="p-6">
              <div className="space-y-5">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph.en}
                    className="leading-8 text-[hsl(var(--foreground-soft))]"
                  >
                    {localizeCopy(paragraph, locale)}
                  </p>
                ))}
              </div>
            </Surface>
          </SectionShell>
        ))}
      </article>
    </PageShell>
  );
}
