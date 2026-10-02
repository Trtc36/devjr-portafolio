import { describe, it, expect } from "vitest";
import { upsertBlogPostSchema } from "./blog-admin.schema";

const validBody = {
  title: "t", slug: "t", excerpt: "e", contentJson: "{}",
  coverImageUrl: null, published: true, publishedAt: null, tagIds: ["1"],
};

describe("upsertBlogPostSchema", () => {
  it("accepts a valid payload", () => {
    expect(upsertBlogPostSchema.safeParse(validBody).success).toBe(true);
  });

  it("rejects a missing title", () => {
    const { title, ...rest } = validBody;
    expect(upsertBlogPostSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects a non-string element in tagIds", () => {
    expect(upsertBlogPostSchema.safeParse({ ...validBody, tagIds: [1] }).success).toBe(false);
  });

  it("rejects contentJson that is not valid JSON", () => {
    expect(
      upsertBlogPostSchema.safeParse({ ...validBody, contentJson: "not valid json" }).success,
    ).toBe(false);
  });

  it("rejects contentJson that parses to a non-object JSON value", () => {
    expect(upsertBlogPostSchema.safeParse({ ...validBody, contentJson: "42" }).success).toBe(false);
    expect(upsertBlogPostSchema.safeParse({ ...validBody, contentJson: "null" }).success).toBe(false);
  });
});
