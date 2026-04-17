"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
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
        <CardHeader className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <Badge variant="accent">
              {localizeCopy(project.tags[0].name, locale)}
            </Badge>
            <span className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
              {formatDate(project.publishedAt, locale)}
            </span>
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

          <div className="flex flex-wrap gap-2">
            {project.technologies.map((technology) => (
              <Badge key={technology.id} variant="neutral">
                {technology.name}
              </Badge>
            ))}
          </div>
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
