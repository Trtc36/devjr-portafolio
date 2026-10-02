import Image from "next/image";
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
import { getProjectBySlug } from "@/services/projects.service";

type ProjectDetailPageProps = {
  params: Promise<{ locale: AppLocale; slug: string }>;
};

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { locale, slug } = await params;
  const project = await getProjectBySlug(slug);

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
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "projects" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const videoEmbedUrl = getEmbedVideoUrl(project.videoUrl);

  return (
    <PageShell className="space-y-16">
      {project.coverImageUrl ? (
        <div className="relative h-[280px] overflow-hidden rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] md:h-[420px]">
          <Image
            src={project.coverImageUrl}
            alt={localizeCopy(project.title, locale)}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        </div>
      ) : null}

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
              {project.liveUrl ? (
                <Button asChild>
                  <a href={project.liveUrl} target="_blank" rel="noreferrer">
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
              {project.tags.length > 0 ? (
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
              ) : null}
              {project.stack.length > 0 ? (
                <Surface variant="elevated" className="p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                    {t("detail.stack")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.stack.map((technology) => (
                      <Badge key={technology} variant="neutral">
                        {technology}
                      </Badge>
                    ))}
                  </div>
                </Surface>
              ) : null}
              {project.authorUsername ? (
                <Surface variant="elevated" className="p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                    Author
                  </p>
                  <p className="mt-3 text-sm text-[hsl(var(--foreground-soft))]">
                    @{project.authorUsername}
                    {project.authorFullName ? ` • ${project.authorFullName}` : ""}
                  </p>
                </Surface>
              ) : null}
              {project.domain ? (
                <Surface variant="elevated" className="p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                    Domain
                  </p>
                  <p className="mt-3 text-sm text-[hsl(var(--foreground-soft))]">
                    {project.domain}
                  </p>
                </Surface>
              ) : null}
            </>
          }
        />
      </div>

      {project.metrics.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-3">
          {project.metrics.map((metric) => (
            <StatCard
              key={`${metric.label.en}-${metric.value}`}
              label={localizeCopy(metric.label, locale)}
              value={metric.value}
            />
          ))}
        </div>
      ) : null}

      {project.repoUrl || project.liveUrl ? (
        <SectionShell title="Technical links">
          <div className="flex flex-wrap gap-4">
            {project.liveUrl ? (
              <Button asChild>
                <a href={project.liveUrl} target="_blank" rel="noreferrer">
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
          </div>
        </SectionShell>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <SectionShell title={t("detail.solution")}>
            <Surface className="space-y-5 p-6">
              {project.contentParagraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="leading-8 text-[hsl(var(--foreground-soft))]"
                >
                  {paragraph}
                </p>
              ))}
            </Surface>
          </SectionShell>

          {videoEmbedUrl ? (
            <SectionShell title="Video walkthrough">
              <Surface className="overflow-hidden p-0">
                <div className="aspect-video">
                  <iframe
                    src={videoEmbedUrl}
                    title={`${localizeCopy(project.title, locale)} video`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </Surface>
            </SectionShell>
          ) : null}
        </div>

        {project.galleryImages.length > 0 ? (
          <SectionShell title={t("detail.gallery")}>
            <div className="grid gap-4">
              {project.galleryImages.map((artifact) => (
                <Surface
                  key={artifact.id}
                  variant="elevated"
                  className="relative h-56 overflow-hidden p-0"
                >
                  {artifact.imageUrl ? (
                    <Image
                      src={artifact.imageUrl}
                      alt={
                        artifact.title
                          ? localizeCopy(artifact.title, locale)
                          : localizeCopy(project.title, locale)
                      }
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : null}
                  {artifact.title || artifact.description ? (
                    <div className="space-y-3 p-5">
                      {artifact.title ? (
                        <p className="text-lg font-semibold tracking-tight">
                          {localizeCopy(artifact.title, locale)}
                        </p>
                      ) : null}
                      {artifact.description ? (
                        <p className="text-sm leading-7 text-[hsl(var(--foreground-soft))]">
                          {localizeCopy(artifact.description, locale)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </Surface>
              ))}
            </div>
          </SectionShell>
        ) : null}
      </div>
    </PageShell>
  );
}

function getEmbedVideoUrl(videoUrl?: string) {
  if (!videoUrl) {
    return null;
  }

  try {
    const url = new URL(videoUrl);

    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (url.hostname.includes("vimeo.com")) {
      const videoId = url.pathname.split("/").filter(Boolean).at(-1);
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }

    if (url.pathname.includes("/embed/")) {
      return videoUrl;
    }
  } catch {
    return null;
  }

  return null;
}
