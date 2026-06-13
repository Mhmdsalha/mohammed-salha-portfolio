import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { requireDashboardAuth } from "@/lib/dashboard-auth";
import { getSiteSettings } from "@/lib/site-settings";

export default async function SettingsPage() {
  await requireDashboardAuth();

  const settings = await getSiteSettings();

  return (
    <>
      <DashboardHeader
        title="Contact Settings"
        description="Update social links, email, WhatsApp, and contact numbers used across the public portfolio."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
