import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectForm } from "@/components/dashboard/ProjectForm";
import { requireDashboardAuth } from "@/lib/dashboard-auth";

export default async function NewProjectPage() {
  await requireDashboardAuth();

  return (
    <>
      <DashboardHeader
        title="Add Project"
        description="Create a new portfolio project. Images can be wired to Supabase Storage with the included upload helper."
      />
      <ProjectForm />
    </>
  );
}
