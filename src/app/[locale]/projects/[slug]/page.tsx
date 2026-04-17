import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { SectionShell } from "@/components/layout/section-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Surface } from "@/components/ui/surface";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { localizeCopy } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { getProjectBySlug, getProjects } from "@/services/projects.service";

type ProjectDetailPageProps = {
  params: Promise<{ locale: AppLocale; slug: string }>;
};

export function generateStaticParams() {
  return getProjects().flatMap((project) =>
    (["en", "es"] as const).map((locale) => ({
      locale,
      slug: project.slug,
    })),
  );
}

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { locale, slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {};
  }

  return buildMetadata({
    locale,
    title: `DevJR | ${localizeCopy(project.title, locale)}`,
    description: localizeCopy(project.summary, locale),
  });
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { locale, slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "projects" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <PageShell className="space-y-16">
      <div className="space-y-4">
        <Link
          href="/projects"
          locale={locale}
          className="text-sm text-[hsl(var(--muted-foreground))]"
        >
          {tCommon("common.backToProjects")}
        </Link>

        <PageHero
          eyebrow={t("detail.eyebrow")}
          title={localizeCopy(project.title, locale)}
          description={localizeCopy(project.summary, locale)}
          actions={
            <>
              {project.demoUrl ? (
                <Button asChild>
                  <a href={project.demoUrl} target="_blank" rel="noreferrer">
                    {tCommon("common.demo")}
                  </a>
                </Button>
              ) : null}
              {project.repoUrl ? (
                <Button variant="secondary" asChild>
                  <a href={project.repoUrl} target="_blank" rel="noreferrer">
                    {tCommon("common.repository")}
                  </a>
                </Button>
              ) : null}
            </>
          }
          aside={
            <>
              <Surface variant="elevated" className="p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  {t("detail.tags")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag.id} variant="accent">
                      {localizeCopy(tag.name, locale)}
                    </Badge>
                  ))}
                </div>
              </Surface>
              <Surface variant="elevated" className="p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  {t("detail.stack")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.technologies.map((technology) => (
                    <Badge key={technology.id} variant="neutral">
                      {technology.name}
                    </Badge>
                  ))}
                </div>
              </Surface>
            </>
          }
        />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {project.metrics.map((metric) => (
          <StatCard
            key={metric.label.en}
            label={localizeCopy(metric.label, locale)}
            value={metric.value}
          />
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <SectionShell title={t("detail.problem")}>
            <Surface className="p-6">
              <p className="leading-8 text-[hsl(var(--foreground-soft))]">
                {localizeCopy(project.problem, locale)}
              </p>
            </Surface>
          </SectionShell>

          <SectionShell title={t("detail.solution")}>
            <Surface className="p-6">
              <p className="leading-8 text-[hsl(var(--foreground-soft))]">
                {localizeCopy(project.solution, locale)}
              </p>
            </Surface>
          </SectionShell>

          <SectionShell title={t("detail.architecture")}>
            <Surface className="p-6">
              <p className="leading-8 text-[hsl(var(--foreground-soft))]">
                {localizeCopy(project.architecture, locale)}
              </p>
            </Surface>
          </SectionShell>

          <SectionShell title={t("detail.impact")}>
            <Surface className="p-6">
              <p className="leading-8 text-[hsl(var(--foreground-soft))]">
                {localizeCopy(project.impact, locale)}
              </p>
            </Surface>
          </SectionShell>
        </div>

        <SectionShell title={t("detail.gallery")}>
          <div className="grid gap-4">
            {project.galleryImages.map((artifact) => (
              <Surface key={artifact.id} variant="elevated" className="p-5">
                <p className="text-lg font-semibold tracking-tight">
                  {localizeCopy(artifact.label, locale)}
                </p>
                <p className="mt-3 text-sm leading-7 text-[hsl(var(--foreground-soft))]">
                  {localizeCopy(artifact.description, locale)}
                </p>
              </Surface>
            ))}
          </div>
        </SectionShell>
      </div>
    </PageShell>
  );
}
