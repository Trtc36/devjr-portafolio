import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/admin/lib/admin-api", () => ({
  apiEndpoints: { adminBlogPostById: (id: string) => `/admin/blog-posts/${id}` },
  requestAdmin: vi.fn().mockResolvedValue({ id: "1" }),
}));

vi.mock("@/features/auth/lib/session", () => ({
  getAdminAccessToken: vi.fn().mockResolvedValue("test-token"),
}));

import { PUT } from "./route";
import { requestAdmin } from "@/features/admin/lib/admin-api";
import { getAdminAccessToken } from "@/features/auth/lib/session";

const validBody = {
  title: "t", slug: "t", excerpt: "e",
  contentJson: JSON.stringify({ blocks: [{ type: "paragraph", data: { text: "<script>alert(1)</script>safe" } }] }),
  coverImageUrl: null, published: true, publishedAt: null, tagIds: ["1"],
};

describe("PUT /api/admin/blog/[id]", () => {
  it("returns 401 before validating the body when there is no admin session", async () => {
    vi.mocked(getAdminAccessToken).mockResolvedValueOnce(null);
    const { title, ...rest } = validBody;
    const res = await PUT(
      new Request("http://x", { method: "PUT", body: JSON.stringify(rest) }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(401);
    expect(requestAdmin).not.toHaveBeenCalled();
  });

  it("returns 400 and does not call requestAdmin when contentJson is not valid JSON", async () => {
    const res = await PUT(
      new Request("http://x", { method: "PUT", body: JSON.stringify({ ...validBody, contentJson: "not valid json" }) }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(400);
    expect(requestAdmin).not.toHaveBeenCalled();
  });

  it("returns 400 and does not call requestAdmin for an invalid body", async () => {
    const { title, ...rest } = validBody;
    const res = await PUT(
      new Request("http://x", { method: "PUT", body: JSON.stringify(rest) }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(400);
    expect(requestAdmin).not.toHaveBeenCalled();
  });

  it("sanitizes contentJson before forwarding a valid body", async () => {
    await PUT(
      new Request("http://x", { method: "PUT", body: JSON.stringify(validBody) }),
      { params: Promise.resolve({ id: "1" }) },
    );
    const forwarded = vi.mocked(requestAdmin).mock.calls[0][1]?.json as { contentJson: string };
    expect(forwarded.contentJson).not.toContain("<script>");
    expect(forwarded.contentJson).toContain("safe");
  });
});
