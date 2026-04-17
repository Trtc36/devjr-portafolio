import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors duration-200",
  {
    variants: {
      variant: {
        default:
          "border-[hsl(var(--border))] bg-[hsl(var(--surface-highlight))] text-[hsl(var(--muted-foreground))]",
        accent:
          "border-[hsl(var(--accent-soft))] bg-[hsla(var(--accent),0.12)] text-[hsl(var(--foreground))]",
        neutral:
          "border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-elevated))] text-[hsl(var(--foreground-soft))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
