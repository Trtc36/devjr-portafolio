import type { AppLocale } from "@/i18n/routing";

export function formatDate(date: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
