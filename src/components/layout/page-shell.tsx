import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 md:py-14 lg:px-8 xl:py-16",
        className,
      )}
    >
      {children}
    </div>
  );
}
