import { z } from "zod";

export const upsertBlogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().min(1),
  contentJson: z.string().min(1),
  coverImageUrl: z.string().nullish(),
  published: z.boolean(),
  publishedAt: z.string().nullish(),
  tagIds: z.array(z.string()),
});
