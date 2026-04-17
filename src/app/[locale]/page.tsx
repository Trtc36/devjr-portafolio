import { LayoutDashboard, Network, Workflow } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { SectionShell } from "@/components/layout/section-shell";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { getFeaturedBlogPosts } from "@/services/blog.service";
import { getFeaturedProjects } from "@/services/projects.service";
import { EditorialPostRow } from "@/features/blog/components/editorial-post-row";
import {
  focusAreas,
  localizeItem,
  platformBlueprint,
  quickFacts,
} from "@/features/shared/data/platform-blueprint";
import { ProjectCard } from "@/features/projects/components/project-card";

type LocaleHomePageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export async function generateMetadata({ params }: LocaleHomePageProps) {
  const { locale } = await params;

  return buildMetadata({
    locale,
    title: "DevJR | Engineering portfolio platform",
    description:
      "Portfolio platform focused on system design, architectural thinking, operational software and product-minded engineering.",
  });
}

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const t = await getTranslations({ locale, namespace: "home" });
  const featuredProjects = getFeaturedProjects();
  const featuredPosts = getFeaturedBlogPosts();

  return (
    <PageShell className="space-y-20">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        description={t("hero.description")}
        actions={
          <>
            <Button asChild>
              <Link href="/projects" locale={locale}>
                {t("hero.primaryCta")}
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/blog" locale={locale}>
                {t("hero.secondaryCta")}
              </Link>
            </Button>
          </>
        }
        aside={
          <>
            {quickFacts.map((fact) => (
              <Surface key={fact.id} variant="elevated" className="p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  {localizeItem(fact.label, locale)}
                </p>
                <p className="mt-3 text-xl font-semibold tracking-tight">{fact.value}</p>
              </Surface>
            ))}
          </>
        }
      />

      <SectionShell
        eyebrow={t("sections.focusEyebrow")}
        title={t("sections.focusTitle")}
        description={t("sections.focusDescription")}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {focusAreas.map((area) => (
            <Surface key={area.id} variant="elevated" className="p-6">
              <h3 className="text-xl font-semibold tracking-tight">
                {localizeItem(area.title, locale)}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[hsl(var(--foreground-soft))]">
                {localizeItem(area.description, locale)}
              </p>
            </Surface>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow={t("sections.platformEyebrow")}
        title={t("sections.platformTitle")}
        description={t("sections.platformDescription")}
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {platformBlueprint.map((item) => (
            <Surface key={item.id} className="p-6">
              <h3 className="text-xl font-semibold tracking-tight">
                {localizeItem(item.title, locale)}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[hsl(var(--foreground-soft))]">
                {localizeItem(item.description, locale)}
              </p>
            </Surface>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        title={t("sections.featuredProjects")}
        description={t("sections.featuredProjectsDescription")}
        action={
          <Button variant="secondary" asChild>
            <Link href="/projects" locale={locale}>
              {tCommon("common.viewAll")}
            </Link>
          </Button>
        }
      >
        <div className="grid gap-6">
          {featuredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              locale={locale}
              project={project}
              ctaLabel={tCommon("common.projectDetails")}
            />
          ))}
        </div>
      </SectionShell>

      <SectionShell
        title={t("sections.featuredPosts")}
        description={t("sections.featuredPostsDescription")}
        action={
          <Button variant="secondary" asChild>
            <Link href="/blog" locale={locale}>
              {tCommon("common.viewAll")}
            </Link>
          </Button>
        }
      >
        <div className="grid gap-6">
          {featuredPosts.map((post) => (
            <EditorialPostRow
              key={post.id}
              locale={locale}
              post={post}
              ctaLabel={tCommon("common.readArticle")}
            />
          ))}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow={t("sections.operatingEyebrow")}
        title={t("sections.operatingTitle")}
        description={t("sections.operatingDescription")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: t("sections.operatingSignals"),
              description: t("sections.operatingSignalsDescription"),
              Icon: Network,
            },
            {
              title: t("sections.operatingBoundaries"),
              description: t("sections.operatingBoundariesDescription"),
              Icon: Workflow,
            },
            {
              title: t("sections.operatingOutcomes"),
              description: t("sections.operatingOutcomesDescription"),
              Icon: LayoutDashboard,
            },
          ].map(({ title, description, Icon }) => (
            <Surface key={title} variant="elevated" className="p-6">
              <Icon className="h-5 w-5 text-[hsl(var(--accent))]" />
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[hsl(var(--foreground-soft))]">
                {description}
              </p>
            </Surface>
          ))}
        </div>
      </SectionShell>
    </PageShell>
  );
}
