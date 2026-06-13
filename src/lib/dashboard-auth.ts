import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function hasDashboardSession() {
  const cookieStore = await cookies();
  return cookieStore.get("dashboard_token")?.value === "authenticated";
}

export async function requireDashboardAuth() {
  const authenticated = await hasDashboardSession();

  if (!authenticated) {
    redirect("/dashboard/login");
  }
}
