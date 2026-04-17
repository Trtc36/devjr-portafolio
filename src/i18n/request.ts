import { getRequestConfig } from "next-intl/server";
import { routing, type AppLocale } from "@/i18n/routing";

const messageLoaders = {
  common: {
    en: () => import("@/i18n/messages/en/common.json"),
    es: () => import("@/i18n/messages/es/common.json"),
  },
  home: {
    en: () => import("@/i18n/messages/en/home.json"),
    es: () => import("@/i18n/messages/es/home.json"),
  },
  projects: {
    en: () => import("@/i18n/messages/en/projects.json"),
    es: () => import("@/i18n/messages/es/projects.json"),
  },
  blog: {
    en: () => import("@/i18n/messages/en/blog.json"),
    es: () => import("@/i18n/messages/es/blog.json"),
  },
  about: {
    en: () => import("@/i18n/messages/en/about.json"),
    es: () => import("@/i18n/messages/es/about.json"),
  },
  contact: {
    en: () => import("@/i18n/messages/en/contact.json"),
    es: () => import("@/i18n/messages/es/contact.json"),
  },
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale: AppLocale =
    requestedLocale && routing.locales.includes(requestedLocale as AppLocale)
      ? (requestedLocale as AppLocale)
      : routing.defaultLocale;

  const entries = await Promise.all(
    Object.entries(messageLoaders).map(async ([namespace, loaders]) => {
      const loader = loaders[locale as keyof typeof loaders];
      const messages = await loader();

      return [namespace, messages.default] as const;
    }),
  );

  return {
    locale,
    messages: Object.fromEntries(entries),
  };
});
