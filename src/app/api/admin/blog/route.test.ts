import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/admin/lib/admin-api", () => ({
  apiEndpoints: { adminBlogPosts: "/admin/blog-posts" },
  requestAdmin: vi.fn().mockResolvedValue({ id: "1" }),
}));

import { POST } from "./route";
import { requestAdmin } from "@/features/admin/lib/admin-api";

const validBody = {
  title: "t", slug: "t", excerpt: "e",
  contentJson: JSON.stringify({ blocks: [{ type: "paragraph", data: { text: "<script>alert(1)</script>safe" } }] }),
  coverImageUrl: null, published: true, publishedAt: null, tagIds: ["1"],
};

describe("POST /api/admin/blog", () => {
  it("returns 400 and does not call requestAdmin for an invalid body", async () => {
    const { title, ...rest } = validBody;
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify(rest) }));
    expect(res.status).toBe(400);
    expect(requestAdmin).not.toHaveBeenCalled();
  });

  it("sanitizes contentJson before forwarding a valid body", async () => {
    await POST(new Request("http://x", { method: "POST", body: JSON.stringify(validBody) }));
    const forwarded = vi.mocked(requestAdmin).mock.calls[0][1]?.json as { contentJson: string };
    expect(forwarded.contentJson).not.toContain("<script>");
    expect(forwarded.contentJson).toContain("safe");
  });
});
