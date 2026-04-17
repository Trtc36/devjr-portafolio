import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const surfaceVariants = cva(
  "rounded-[1.5rem] border text-[hsl(var(--foreground))] shadow-[0_18px_40px_-30px_hsla(var(--shadow-strong),0.18),0_1px_0_0_hsla(var(--background),0.65)_inset] transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "border-[hsl(var(--border))] bg-[hsl(var(--surface))]",
        elevated:
          "border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-elevated))]",
        highlight:
          "border-[hsla(var(--accent-soft),0.72)] bg-[linear-gradient(180deg,hsla(var(--surface),0.98),hsla(var(--surface-highlight),0.94))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type SurfaceProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof surfaceVariants>;

export function Surface({
  className,
  variant,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(surfaceVariants({ variant }), className)}
      {...props}
    />
  );
}
