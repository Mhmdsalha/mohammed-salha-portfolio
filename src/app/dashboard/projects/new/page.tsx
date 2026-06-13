import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectForm } from "@/components/dashboard/ProjectForm";

export default function NewProjectPage() {
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
