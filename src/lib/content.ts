import type { AppLocale } from "@/i18n/routing";
import type { LocalizedString } from "@/types/common";

export function localizeCopy(value: LocalizedString, locale: AppLocale) {
  return value[locale];
}
