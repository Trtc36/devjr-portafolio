import type { AppLocale } from "@/i18n/routing";

export type LocalizedString = Record<AppLocale, string>;

export type TagType = "domain" | "technology" | "focus";

export type Tag = {
  id: string;
  slug: string;
  name: LocalizedString;
  type: TagType;
};

export type Technology = {
  id: string;
  name: string;
  icon: string;
};
