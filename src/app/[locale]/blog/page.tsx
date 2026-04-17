import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { SectionShell } from "@/components/layout/section-shell";
import { TagFilterBar } from "@/components/tag-filter-bar";
import { Surface } from "@/components/ui/surface";
import type { AppLocale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { getBlogPosts } from "@/services/blog.service";
import { getTags } from "@/services/tags.service";
import { EditorialPostRow } from "@/features/blog/components/editorial-post-row";

type BlogPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ tag?: string }>;
};

export async function generateMetadata({ params }: BlogPageProps) {
  const { locale } = await params;

  return buildMetadata({
    locale,
    title: "DevJR | Blog",
    description:
      "Technical writing on backend systems, data movement, observability and software architecture trade-offs.",
  });
}

export default async function BlogPage({
  params,
  searchParams,
}: BlogPageProps) {
  const { locale } = await params;
  const { tag } = await searchParams;
  const t = await getTranslations({ locale, namespace: "blog" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const allPosts = getBlogPosts();
  const posts = allPosts.filter((post) =>
    tag ? post.tags.some((postTag) => postTag.slug === tag) : true,
  );
  const tags = getTags();

  return (
    <PageShell className="space-y-16">
      <PageHero
        eyebrow={t("listing.eyebrow")}
        title={t("listing.title")}
        description={t("listing.description")}
        aside={
          <>
            <Surface variant="elevated" className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                {t("listing.volumeLabel")}
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{posts.length}</p>
            </Surface>
            <Surface variant="elevated" className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                {t("listing.editorialLabel")}
              </p>
              <p className="mt-3 text-sm leading-7 text-[hsl(var(--foreground-soft))]">
                {t("listing.editorialDescription")}
              </p>
            </Surface>
          </>
        }
      />

      <SectionShell
        title={t("listing.filtersLabel")}
        description={t("listing.filtersDescription")}
      >
        <TagFilterBar
          basePath="/blog"
          locale={locale}
          tags={tags}
          activeTag={tag}
          allLabel={tCommon("common.viewAll")}
        />
      </SectionShell>

      <div className="grid gap-6">
        {posts.map((post) => (
          <EditorialPostRow
            key={post.id}
            locale={locale}
            post={post}
            ctaLabel={tCommon("common.readArticle")}
          />
        ))}
      </div>
    </PageShell>
  );
}
