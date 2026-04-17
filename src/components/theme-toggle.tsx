"use client";

import { useSyncExternalStore } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

function subscribe() {
  return () => undefined;
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations("common");
  const isDark = theme === "dark";
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={isDark ? t("theme.toggleToLight") : t("theme.toggleToDark")}
      className="h-9 w-9 border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-0 text-[hsl(var(--accent))] shadow-[0_10px_24px_-20px_hsla(var(--shadow-strong),0.4)]"
    >
      {!hydrated ? (
        <span className="h-4 w-4 rounded-full border border-current opacity-60" />
      ) : isDark ? (
        <SunMedium className="h-4 w-4" />
      ) : (
        <MoonStar className="h-4 w-4" />
      )}
    </Button>
  );
}
