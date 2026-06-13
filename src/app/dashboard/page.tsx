import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireDashboardAuth } from "@/lib/dashboard-auth";
import { getProjects } from "@/lib/projects";

export default async function DashboardPage() {
  await requireDashboardAuth();

  const projects = await getProjects({ fallbackToMock: false });
  const featured = projects.filter((project) => project.featured);
  const latest = projects.slice(0, 5);

  return (
    <>
      <DashboardHeader
        title="Overview"
        description="Manage the project content that powers the public portfolio."
        action={
          <Link
            href="/dashboard/projects/new"
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-neon)] px-5 text-sm font-semibold text-white"
          >
            <Plus size={16} /> Add Project
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Projects", projects.length],
          ["Featured Projects", featured.length],
          ["Last Updated", new Date(projects[0]?.updated_at ?? Date.now()).toLocaleDateString()],
          ["Storage Used", "Ready"]
        ].map(([label, value]) => (
          <GlassCard key={label} className="p-5">
            <p className="text-sm text-[var(--text-secondary)]">{label}</p>
            <p className="neon-text mt-4 font-duran text-4xl font-black">{value}</p>
          </GlassCard>
        ))}
      </div>
      <GlassCard className="mt-6 p-6">
        <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
        <div className="mt-5 space-y-3">
          {latest.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4"
            >
              <div>
                <p className="font-semibold text-white">{project.title_en}</p>
                <p className="text-xs text-[var(--text-muted)]">{project.category}</p>
              </div>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                #{project.order_num}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </>
  );
}
