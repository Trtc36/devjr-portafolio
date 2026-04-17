import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/ui/surface";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  className,
}: PageHeroProps) {
  return (
    <section className={cn("grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]", className)}>
      <Surface
        variant="highlight"
        className="relative overflow-hidden p-8 md:p-10 lg:p-12"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,hsla(var(--accent),0.08),transparent)]"
        />
        <div className="space-y-6">
          <div className="space-y-3">
            {eyebrow ? (
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[hsl(var(--accent))]">
                {eyebrow}
              </p>
            ) : null}
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] md:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-[hsl(var(--foreground-soft))] md:text-lg">
                {description}
              </p>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </Surface>
      {aside ? <div className="grid gap-4 self-stretch">{aside}</div> : null}
    </section>
  );
}
