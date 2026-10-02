import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminSession } from "@/features/auth/types/auth.dto";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
  isSessionExpired,
} from "./session-token";

export { isSessionExpired };

export function isValidAdminSession(
  session: AdminSession | null,
): session is AdminSession {
  return Boolean(
    session &&
      session.accessToken &&
      session.user?.role === "Admin" &&
      !isSessionExpired(session.expiresAtUtc),
  );
}

export async function createAdminSessionCookie(session: AdminSession) {
  const cookieStore = await cookies();
  const expiresAt = new Date(session.expiresAtUtc);

  cookieStore.set(SESSION_COOKIE_NAME, signSessionToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawSession) {
    return null;
  }

  return verifySessionToken(rawSession);
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!isValidAdminSession(session)) {
    redirect("/admin/login");
  }

  return session;
}

export async function getAdminAccessToken() {
  const session = await getAdminSession();

  return session?.accessToken ?? null;
}
