import { describe, it, expect, vi } from "vitest";
import { signSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from "./session-token";
import type { AdminSession } from "@/features/auth/types/auth.dto";

const validSession: AdminSession = {
  accessToken: "token",
  expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
  user: { id: "1", email: "a@b.com", fullName: "A B", username: "ab", role: "Admin" },
};

describe("signSessionToken / verifySessionToken", () => {
  it("round-trips a valid session", () => {
    const token = signSessionToken(validSession);
    expect(verifySessionToken(token)).toEqual(validSession);
  });

  it("rejects a tampered payload", () => {
    const token = signSessionToken(validSession);
    const [payload, signature] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...validSession, user: { ...validSession.user, role: "Admin-tampered" } }),
    ).toString("base64url");
    expect(verifySessionToken(`${tamperedPayload}.${signature}`)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const token = signSessionToken(validSession);
    const [payload] = token.split(".");
    expect(verifySessionToken(`${payload}.not-a-real-signature`)).toBeNull();
  });

  it("rejects a legacy unsigned cookie (no signature segment)", () => {
    const legacy = Buffer.from(JSON.stringify(validSession), "utf8").toString("base64url");
    expect(verifySessionToken(legacy)).toBeNull();
  });

  it("rejects a validly-signed but expired session", () => {
    const expired: AdminSession = { ...validSession, expiresAtUtc: new Date(Date.now() - 1000).toISOString() };
    const token = signSessionToken(expired);
    expect(verifySessionToken(token)).toBeNull();
  });

  it("throws at module load when SESSION_SECRET is missing", async () => {
    vi.resetModules();
    const original = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    await expect(import("./session-token")).rejects.toThrow();
    process.env.SESSION_SECRET = original;
  });
});
