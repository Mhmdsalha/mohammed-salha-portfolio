"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAttemptStore } from "@/lib/auth/attempt-store";
import { verifyDashboardPassword } from "@/lib/auth/password";
import { createLoginLimiter, getClientIp, hashClientKey } from "@/lib/auth/rate-limit";
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  createSessionToken,
  getSessionKey,
  sessionCookieOptions
} from "@/lib/auth/session";

type LoginState = { success: boolean; message: string };

const INVALID = { success: false, message: "Invalid password." };
const TOO_MANY = { success: false, message: "Too many attempts. Try again in 15 minutes." };
const UNAVAILABLE = { success: false, message: "Login is unavailable. Try again later." };

async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: SESSION_COOKIE, path: "/" });
  cookieStore.delete({ name: LEGACY_SESSION_COOKIE, path: "/dashboard" });
}

export async function loginAction(_previousState: LoginState, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const key = getSessionKey();

  if (!key) {
    console.error("SESSION_SECRET is missing or shorter than 32 characters; login is disabled.");
    return UNAVAILABLE;
  }

  const clientKey = hashClientKey(getClientIp(await headers()));
  let limiter: ReturnType<typeof createLoginLimiter>;

  try {
    limiter = createLoginLimiter(createSupabaseAttemptStore());

    if (await limiter.isBlocked(clientKey)) {
      return TOO_MANY;
    }
  } catch (error) {
    // Without the rate-limit store the password could be brute-forced, so fail closed.
    console.error("Login rate limiter unavailable:", error);
    return UNAVAILABLE;
  }

  if (!(await verifyDashboardPassword(password))) {
    try {
      await limiter.recordFailure(clientKey);
    } catch (error) {
      console.error("Could not record failed login:", error);
    }
    return INVALID;
  }

  try {
    await limiter.recordSuccess(clientKey);
  } catch (error) {
    console.error("Could not clear failed logins:", error);
  }

  await clearSessionCookies();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionToken(key), sessionCookieOptions);

  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookies();
  redirect("/dashboard/login");
}
