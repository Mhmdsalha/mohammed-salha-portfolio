import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectTable } from "@/components/dashboard/ProjectTable";
import { requireDashboardAuth } from "@/lib/dashboard-auth";
import { getProjects } from "@/lib/projects";

export default async function ProjectsPage() {
  await requireDashboardAuth();

  const projects = await getProjects({ fallbackToMock: false });

  return (
    <>
      <DashboardHeader
        title="Projects"
        description="Search, review, edit, and delete portfolio projects."
        action={
          <Link
            href="/dashboard/projects/new"
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-neon)] px-5 text-sm font-semibold text-white"
          >
            <Plus size={16} /> Add Project
          </Link>
        }
      />
      <ProjectTable projects={projects} />
    </>
  );
}
