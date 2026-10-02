import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/admin/lib/admin-api", () => ({
  apiEndpoints: { adminProjectById: (id: string) => `/admin/projects/${id}` },
  requestAdmin: vi.fn().mockResolvedValue({ id: "1" }),
}));

import { PUT } from "./route";
import { requestAdmin } from "@/features/admin/lib/admin-api";

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

describe("PUT /api/admin/projects/[id]", () => {
  it("returns 400 and does not call requestAdmin for an invalid body", async () => {
    const { title, ...rest } = validBody;
    const res = await PUT(
      new Request("http://x", { method: "PUT", body: JSON.stringify(rest) }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(400);
    expect(requestAdmin).not.toHaveBeenCalled();
  });

  it("forwards a valid body to requestAdmin and returns its data", async () => {
    const res = await PUT(
      new Request("http://x", { method: "PUT", body: JSON.stringify(validBody) }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(requestAdmin).toHaveBeenCalledWith("/admin/projects/1", {
      method: "PUT",
      json: validBody,
    });
    const data = await res.json();
    expect(data).toEqual({ id: "1" });
  });
});
