import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/admin/lib/admin-api", () => ({
  apiEndpoints: { adminUsers: "/admin/users" },
  requestAdmin: vi.fn().mockResolvedValue({ id: "1" }),
}));

import { POST } from "./route";
import { requestAdmin } from "@/features/admin/lib/admin-api";

const validBody = {
  fullName: "Jane Doe",
  username: "janedoe",
  email: "jane@example.com",
  password: "supersecret",
  role: "admin",
};

describe("POST /api/admin/users", () => {
  it("returns 400 and does not call requestAdmin for an invalid body", async () => {
    const { email, ...rest } = validBody;
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ ...rest, email: "not-an-email" }) }));
    expect(res.status).toBe(400);
    expect(requestAdmin).not.toHaveBeenCalled();
  });

  it("forwards a valid body to requestAdmin and returns its data", async () => {
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify(validBody) }));
    expect(requestAdmin).toHaveBeenCalledWith("/admin/users", {
      method: "POST",
      json: validBody,
    });
    const data = await res.json();
    expect(data).toEqual({ id: "1" });
  });
});
