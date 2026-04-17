import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/brand-mark";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export default async function Footer({ locale }: { locale: AppLocale }) {
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <footer className="mt-12 border-t border-[hsla(var(--border),0.9)] bg-[linear-gradient(180deg,hsla(var(--surface),0.86),hsla(var(--surface-elevated),0.94))]">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <BrandMark className="h-10 w-10 text-base" />
            <p className="text-sm font-semibold tracking-[0.12em] text-[hsl(var(--foreground))]">
              {t("brand.name")}
            </p>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[hsl(var(--muted-foreground))]">
            {t("footer.summary")}
          </p>
        </div>

        <div className="grid gap-4 text-sm text-[hsl(var(--muted-foreground))] sm:grid-cols-2">
          <p className="leading-7">{t("footer.status")}</p>
          <div className="flex flex-wrap gap-4 sm:justify-end">
            <Link href="/projects" locale={locale} className="transition-colors hover:text-[hsl(var(--foreground))]">
              {t("nav.projects")}
            </Link>
            <Link href="/blog" locale={locale} className="transition-colors hover:text-[hsl(var(--foreground))]">
              {t("nav.blog")}
            </Link>
            <Link href="/contact" locale={locale} className="transition-colors hover:text-[hsl(var(--foreground))]">
              {t("nav.contact")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
