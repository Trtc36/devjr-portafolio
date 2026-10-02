import { describe, it, expect } from "vitest";
import { upsertProjectSchema } from "./project-admin.schema";

const validBody = {
  title: "t",
  slug: "t",
  description: "d",
  content: "c",
  domain: "d",
  coverImageUrl: null,
  galleryImages: ["img.png"],
  stack: ["typescript"],
  metrics: { users: "100" },
  repoUrl: null,
  liveUrl: null,
  videoUrl: null,
  featured: true,
  published: true,
  tagIds: ["1"],
};

describe("upsertProjectSchema", () => {
  it("accepts a valid payload", () => {
    expect(upsertProjectSchema.safeParse(validBody).success).toBe(true);
  });

  it("rejects a missing title", () => {
    const { title, ...rest } = validBody;
    expect(upsertProjectSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects a stack array containing a number", () => {
    expect(
      upsertProjectSchema.safeParse({ ...validBody, stack: [1] }).success,
    ).toBe(false);
  });
});
