"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(
  _previousState: { success: boolean; message: string },
  formData: FormData
) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected || password !== expected) {
    return { success: false, message: "Invalid password." };
  }

  const cookieStore = await cookies();
  cookieStore.set("dashboard_token", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/dashboard"
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("dashboard_token");
  redirect("/dashboard/login");
}
