import crypto from "node:crypto";
import type { AdminSession } from "@/features/auth/types/auth.dto";

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET environment variable is required to sign admin session tokens.",
  );
}

export const SESSION_COOKIE_NAME = "devjr-admin-session";

export function isSessionExpired(expiresAtUtc: string) {
  return new Date(expiresAtUtc).getTime() <= Date.now();
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", SESSION_SECRET as string)
    .update(payload)
    .digest("base64url");
}

export function signSessionToken(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url",
  );
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifySessionToken(raw: string): AdminSession | null {
  const parts = raw.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;
  const expectedSignature = sign(payload);

  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
    return null;
  }

  let session: AdminSession;

  try {
    session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as AdminSession;
  } catch {
    return null;
  }

  if (
    !session ||
    !session.accessToken ||
    session.user?.role !== "Admin" ||
    isSessionExpired(session.expiresAtUtc)
  ) {
    return null;
  }

  return session;
}
