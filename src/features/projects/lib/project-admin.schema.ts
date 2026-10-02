import { z } from "zod";

export const upsertProjectSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  content: z.string().min(1),
  domain: z.string().min(1),
  coverImageUrl: z.string().nullish(),
  galleryImages: z.array(z.string()),
  stack: z.array(z.string()),
  metrics: z.record(z.string(), z.string().nullable()),
  repoUrl: z.string().nullish(),
  liveUrl: z.string().nullish(),
  videoUrl: z.string().nullish(),
  featured: z.boolean(),
  published: z.boolean(),
  tagIds: z.array(z.string()),
});
