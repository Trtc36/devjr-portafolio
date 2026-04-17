"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-1 shadow-[0_10px_24px_-20px_hsla(var(--shadow-strong),0.4)]">
      {(["en", "es"] as const).map((nextLocale) => (
        <button
          key={nextLocale}
          type="button"
          className={cn(
            "rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] transition-all duration-200",
            locale === nextLocale
              ? "bg-[hsl(var(--surface-highlight))] text-[hsl(var(--foreground))] shadow-[0_8px_18px_-16px_hsla(var(--shadow-strong),0.5)]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
          )}
          aria-label={`${t("language.label")} ${t(`language.${nextLocale}`)}`}
          onClick={() => router.replace(pathname, { locale: nextLocale })}
        >
          {t(`language.${nextLocale}`)}
        </button>
      ))}
    </div>
  );
}
