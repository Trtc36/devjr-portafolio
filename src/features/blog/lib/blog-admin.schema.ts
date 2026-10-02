import { z } from "zod";

export const upsertBlogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().min(1),
  contentJson: z
    .string()
    .min(1)
    .refine(
      (value) => {
        try {
          const parsed: unknown = JSON.parse(value);
          return typeof parsed === "object" && parsed !== null;
        } catch {
          return false;
        }
      },
      { message: "contentJson must be valid JSON" },
    ),
  coverImageUrl: z.string().nullish(),
  published: z.boolean(),
  publishedAt: z.string().nullish(),
  tagIds: z.array(z.string()),
});
