import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-[hsl(var(--border))] bg-[linear-gradient(180deg,hsla(var(--surface),0.98),hsla(var(--surface-elevated),0.92))] text-[hsl(var(--card-foreground))] shadow-[0_20px_48px_-36px_hsla(var(--shadow-strong),0.24),0_1px_0_0_hsla(var(--background),0.7)_inset] transition-all duration-200",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-3 p-6 md:p-7", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0 md:p-7 md:pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between p-6 pt-0 md:p-7 md:pt-0", className)}
      {...props}
    />
  );
}
