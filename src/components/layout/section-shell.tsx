import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionShell({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
}: SectionShellProps) {
  return (
    <section className={cn("space-y-8 rounded-[2rem] border border-transparent py-1", className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          {eyebrow ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[hsl(var(--accent))]">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
              {title}
            </h2>
            {description ? (
              <p className="max-w-2xl text-sm leading-7 text-[hsl(var(--muted-foreground))] md:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="h-px w-full bg-[linear-gradient(90deg,hsla(var(--border-strong),0.8),transparent_72%)]" />
      {children}
    </section>
  );
}
