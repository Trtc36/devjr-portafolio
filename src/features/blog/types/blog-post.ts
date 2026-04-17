import type { LocalizedString, Tag } from "@/types/common";

export type BlogSection = {
  id: string;
  title: LocalizedString;
  body: LocalizedString[];
};

export type BlogPost = {
  id: string;
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  coverImageUrl: string;
  publishedAt: string;
  readTime: string;
  tags: Tag[];
  sections: BlogSection[];
  isFeatured: boolean;
};
