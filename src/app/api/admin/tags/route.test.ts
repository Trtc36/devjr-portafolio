import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/admin/lib/admin-api", () => ({
  apiEndpoints: { adminTags: "/admin/tags" },
  requestAdmin: vi.fn().mockResolvedValue({ id: "1" }),
}));

import { POST } from "./route";
import { requestAdmin } from "@/features/admin/lib/admin-api";

const validBody = { name: "t", slug: "t" };

describe("POST /api/admin/tags", () => {
  it("returns 400 and does not call requestAdmin for an invalid body", async () => {
    const { slug, ...rest } = validBody;
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify(rest) }));
    expect(res.status).toBe(400);
    expect(requestAdmin).not.toHaveBeenCalled();
  });

  it("forwards a valid body to requestAdmin and returns its data", async () => {
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify(validBody) }));
    expect(requestAdmin).toHaveBeenCalledWith("/admin/tags", {
      method: "POST",
      json: validBody,
    });
    const data = await res.json();
    expect(data).toEqual({ id: "1" });
  });
});
