"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { localizeCopy } from "@/lib/content";
import { formatDate } from "@/lib/formatters";
import type { Project } from "@/features/projects/types/project";

export function ProjectCard({
  locale,
  project,
  ctaLabel,
}: {
  locale: AppLocale;
  project: Project;
  ctaLabel: string;
}) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.18 }}>
      <Card className="group h-full hover:border-[hsl(var(--accent-soft))] hover:shadow-[0_28px_56px_-34px_hsla(var(--shadow-strong),0.34)]">
        {project.coverImageUrl ? (
          <div className="relative h-56 overflow-hidden border-b border-[hsl(var(--border))]">
            <Image
              src={project.coverImageUrl}
              alt={localizeCopy(project.title, locale)}
              fill
              sizes="(max-width: 1152px) 100vw, 1088px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        ) : null}

        <CardHeader className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            {project.tags[0] ? (
              <Badge variant="accent">
                {localizeCopy(project.tags[0].name, locale)}
              </Badge>
            ) : <span />}
            <div className="text-right text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
              <div>{formatDate(project.publishedAt, locale)}</div>
              {project.authorUsername ? <div>@{project.authorUsername}</div> : null}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-semibold tracking-tight">
              {localizeCopy(project.title, locale)}
            </h3>
            <p className="max-w-3xl text-sm leading-7 text-[hsl(var(--foreground-soft))] md:text-base">
              {localizeCopy(project.summary, locale)}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {project.metrics.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {project.metrics.map((metric) => (
                <div
                  key={metric.label.en}
                  className="rounded-2xl border border-[hsl(var(--border))] bg-[linear-gradient(180deg,hsla(var(--surface-highlight),0.92),hsla(var(--surface),0.96))] p-4 transition-colors group-hover:border-[hsl(var(--border-strong))]"
                >
                  <p className="text-xl font-semibold tracking-tight">{metric.value}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                    {localizeCopy(metric.label, locale)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {project.stack.map((technology) => (
              <Badge key={technology} variant="neutral">
                {technology}
              </Badge>
            ))}
          </div>

          {project.repoUrl || project.liveUrl ? (
            <div className="flex flex-wrap gap-3 text-sm">
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[hsl(var(--accent))]"
                >
                  Live demo
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              ) : null}
              {project.repoUrl ? (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[hsl(var(--foreground-soft))]"
                >
                  Repository
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="border-t border-[hsl(var(--border))] pt-5">
          <Link
            href={`/projects/${project.slug}`}
            locale={locale}
            className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] transition-colors group-hover:text-[hsl(var(--accent))]"
          >
            {ctaLabel}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
