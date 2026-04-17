import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/brand-mark";
import LanguageSwitcher from "@/components/language-switcher";
import MainNav from "@/components/layout/main-nav";
import ThemeToggle from "@/components/theme-toggle";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export default async function Header({ locale }: { locale: AppLocale }) {
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <header className="sticky top-0 z-40 border-b border-[hsla(var(--border),0.8)] bg-[hsla(var(--background),0.78)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <Link
            href="/"
            locale={locale}
            className="flex items-center gap-3 text-[hsl(var(--foreground))]"
          >
            <BrandMark compact className="shrink-0" />
            <span className="min-w-0">
              <span className="block text-lg font-semibold tracking-[0.08em]">
                {t("brand.name")}
              </span>
              <span className="hidden text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] lg:block">
                {t("brand.tagline")}
              </span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <MainNav />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
