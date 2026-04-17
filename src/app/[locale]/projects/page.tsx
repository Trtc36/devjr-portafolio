import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { SectionShell } from "@/components/layout/section-shell";
import { TagFilterBar } from "@/components/tag-filter-bar";
import { Surface } from "@/components/ui/surface";
import type { AppLocale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { getProjects } from "@/services/projects.service";
import { getTags } from "@/services/tags.service";
import { ProjectCard } from "@/features/projects/components/project-card";

type ProjectsPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ tag?: string }>;
};

export async function generateMetadata({ params }: ProjectsPageProps) {
  const { locale } = await params;

  return buildMetadata({
    locale,
    title: "DevJR | Projects",
    description:
      "Structured engineering projects around logistics systems, ETL monitoring and enterprise software delivery.",
  });
}

export default async function ProjectsPage({
  params,
  searchParams,
}: ProjectsPageProps) {
  const { locale } = await params;
  const { tag } = await searchParams;
  const t = await getTranslations({ locale, namespace: "projects" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const allProjects = getProjects();
  const projects = allProjects.filter((project) =>
    tag ? project.tags.some((projectTag) => projectTag.slug === tag) : true,
  );
  const projectTags = getTags().filter((item) => item.type !== "technology");

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
                {t("listing.catalogLabel")}
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {projects.length}
              </p>
            </Surface>
            <Surface variant="elevated" className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                {t("listing.focusLabel")}
              </p>
              <p className="mt-3 text-sm leading-7 text-[hsl(var(--foreground-soft))]">
                {t("listing.focusDescription")}
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
          basePath="/projects"
          locale={locale}
          tags={projectTags}
          activeTag={tag}
          allLabel={tCommon("common.viewAll")}
        />
      </SectionShell>

      <div className="grid gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            locale={locale}
            project={project}
            ctaLabel={tCommon("common.projectDetails")}
          />
        ))}
      </div>
    </PageShell>
  );
}
