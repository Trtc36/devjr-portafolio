import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/routing";

export function buildMetadata({
  locale,
  title,
  description,
}: {
  locale: AppLocale;
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      languages: {
        en: "/en",
        es: "/es",
      },
    },
    openGraph: {
      title,
      description,
      locale,
      type: "website",
    },
  };
}
