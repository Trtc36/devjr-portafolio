"use client";

import { useEffect } from "react";
import "./globals.css";
import "@/styles/tokens.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        style={{ fontFamily: "system-ui, sans-serif" }}
        className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased"
      >
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
              Something went wrong
            </h1>
            <p className="max-w-md text-base leading-7 text-[hsl(var(--foreground-soft))]">
              We hit an unexpected error. Please try again or return to the homepage.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => unstable_retry()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[hsl(var(--accent-strong))] bg-[hsl(var(--accent))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--accent-foreground))] transition-colors hover:bg-[hsl(var(--accent-strong))]"
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain anchor intentional: the root layout/router may be the thing that broke, so this fallback avoids depending on next/link */}
            <a
              href="/en"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--surface-highlight))]"
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
