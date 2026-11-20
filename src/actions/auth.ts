"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAttemptStore } from "@/lib/auth/attempt-store";
import { attemptLogin, type LoginOutcome } from "@/lib/auth/login";
import { verifyDashboardPassword } from "@/lib/auth/password";
import { getClientIp, hashClientKey, type AttemptStore } from "@/lib/auth/rate-limit";
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  createSessionToken,
  getSessionKey,
  sessionCookieOptions
} from "@/lib/auth/session";

type LoginState = { success: boolean; message: string };

const MESSAGES: Record<Exclude<LoginOutcome, "ok">, LoginState> = {
  invalid: { success: false, message: "Invalid password." },
  blocked: { success: false, message: "Too many attempts. Try again in 15 minutes." },
  unavailable: { success: false, message: "Login is unavailable. Try again later." }
};

async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: SESSION_COOKIE, path: "/" });
  cookieStore.delete({ name: LEGACY_SESSION_COOKIE, path: "/dashboard" });
}

export async function loginAction(_previousState: LoginState, formData: FormData) {
  const key = getSessionKey();

  if (!key) {
    console.error("SESSION_SECRET is missing or shorter than 32 characters; login is disabled.");
    return MESSAGES.unavailable;
  }

  let store: AttemptStore;
  try {
    store = createSupabaseAttemptStore();
  } catch (error) {
    console.error("Login rate limiter unavailable:", error);
    return MESSAGES.unavailable;
  }

  const outcome = await attemptLogin({
    password: String(formData.get("password") ?? ""),
    keyHash: hashClientKey(getClientIp(await headers())),
    store,
    verify: verifyDashboardPassword
  });

  if (outcome !== "ok") {
    return MESSAGES[outcome];
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
