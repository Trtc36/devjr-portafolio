import { describe, it, expect } from "vitest";
import { createTagSchema } from "./tag-admin.schema";

const validBody = { name: "t", slug: "t" };

describe("createTagSchema", () => {
  it("accepts a valid payload", () => {
    expect(createTagSchema.safeParse(validBody).success).toBe(true);
  });

  it("rejects a missing slug", () => {
    const { slug, ...rest } = validBody;
    expect(createTagSchema.safeParse(rest).success).toBe(false);
  });
});
