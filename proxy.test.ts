import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import proxy from "./proxy";
import { signSessionToken, SESSION_COOKIE_NAME } from "@/features/auth/lib/session-token";
import type { AdminSession } from "@/features/auth/types/auth.dto";

// next-intl/middleware statically imports "next/server" without an extension,
// which fails to resolve under Next.js 16's native Node ESM resolution outside
// of Next's own bundler. Stub it so these /admin-only tests never need to load
// the real module (none of these requests reach the i18n branch of proxy.ts).
vi.mock("next-intl/middleware", () => ({
  default: () => () => NextResponse.next(),
}));

const validSession: AdminSession = {
  accessToken: "token",
  expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
  user: { id: "1", email: "a@b.com", fullName: "A B", username: "ab", role: "Admin" },
};

function requestWithCookie(path: string, cookieValue?: string) {
  const headers = new Headers();
  if (cookieValue) headers.set("cookie", `${SESSION_COOKIE_NAME}=${cookieValue}`);
  return new NextRequest(new URL(path, "https://example.com"), { headers });
}

describe("proxy admin guard", () => {
  it("redirects to /admin/login when the cookie is missing", () => {
    const res = proxy(requestWithCookie("/admin"));
    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toContain("/admin/login");
  });

  it("redirects to /admin/login when the cookie is tampered", () => {
    const token = signSessionToken(validSession);
    const res = proxy(requestWithCookie("/admin", `${token}x`));
    expect(res?.headers.get("location")).toContain("/admin/login");
  });

  it("lets the request through when the cookie is valid", () => {
    const token = signSessionToken(validSession);
    const res = proxy(requestWithCookie("/admin", token));
    expect(res?.headers.get("location")).toBeNull();
  });

  it("does not guard /admin/login itself", () => {
    const res = proxy(requestWithCookie("/admin/login"));
    expect(res?.headers.get("location")).toBeNull();
  });
});
