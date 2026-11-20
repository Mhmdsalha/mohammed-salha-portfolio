import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  getSessionKey,
  verifySessionToken,
  type AdminSession
} from "@/lib/auth/session";

export const UNAUTHORIZED = Object.freeze({ success: false as const, message: "Unauthorized." });
export type Unauthorized = typeof UNAUTHORIZED;

/** The verified admin session from the request cookie, or null. Never trusts an unsigned value. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value, getSessionKey());
}

/**
 * First line of every server action that needs the admin (PLAN.md R8):
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 *
 * Middleware alone is not enough: an action can be POSTed to any route.
 */
export async function requireAdmin(): Promise<Unauthorized | null> {
  return (await getAdminSession()) ? null : UNAUTHORIZED;
}

/** For dashboard pages and layouts: redirect to the login page without a valid session. */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    redirect("/dashboard/login");
  }

  return session;
}
