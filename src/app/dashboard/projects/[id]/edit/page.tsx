import { notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectForm } from "@/components/dashboard/ProjectForm";
import { requireDashboardAuth } from "@/lib/dashboard-auth";
import { getProjects } from "@/lib/projects";

export default async function EditProjectPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDashboardAuth();

  const { id } = await params;
  const projects = await getProjects({ fallbackToMock: false });
  const project = projects.find((item) => item.id === id);

  if (!project) {
    notFound();
  }

  return (
    <>
      <DashboardHeader
        title="Edit Project"
        description="Update bilingual content, sorting, tags, links, and project settings."
      />
      <ProjectForm project={project} />
    </>
  );
}
