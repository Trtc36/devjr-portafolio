import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-2xl border border-[hsla(var(--accent-soft),0.65)] bg-[linear-gradient(180deg,hsla(var(--surface-highlight),0.9),hsla(var(--surface),0.96))] text-[hsl(var(--accent-strong))] shadow-[0_16px_36px_-24px_hsla(var(--shadow-strong),0.28)]",
        compact ? "h-11 w-11 text-lg" : "h-12 w-12 text-xl",
        className,
      )}
    >
      <span className="font-mono font-semibold tracking-[-0.12em]">{`</>`}</span>
    </span>
  );
}
