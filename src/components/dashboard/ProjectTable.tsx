"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProject } from "@/actions/projects";
import { GlassCard } from "@/components/ui/GlassCard";
import { Project } from "@/types";

export function ProjectTable({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const value = query.toLowerCase().trim();
    if (!value) {
      return projects;
    }
    return projects.filter((project) =>
      `${project.title_en} ${project.title_ar} ${project.category}`.toLowerCase().includes(value)
    );
  }, [projects, query]);

  const onDelete = async (id: string) => {
    const result = await deleteProject(id);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <GlassCard className="overflow-hidden">
      <div className="border-b border-[var(--border)] p-4">
        <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/[0.03] px-4">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--text-muted)]"
          />
        </label>
      </div>
      {projects.length === 0 ? (
        <div className="p-10 text-center">
          <p className="font-duran text-3xl font-black text-white">No real projects yet</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Supabase is connected. Add your first project to create a real UUID row and persist edits.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="focus-ring mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-neon)] px-5 text-sm font-semibold text-white"
          >
            <Plus size={16} /> Add First Project
          </Link>
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
            <tr>
              <th className="px-5 py-4">Project</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Featured</th>
              <th className="px-5 py-4">Order</th>
              <th className="px-5 py-4">Updated</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => (
              <tr key={project.id} className="border-t border-[var(--border)]">
                <td className="px-5 py-4">
                  <p className="font-semibold text-white">{project.title_en}</p>
                  <p className="font-arabic text-xs text-[var(--text-muted)]">{project.title_ar}</p>
                </td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">{project.category}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2 py-1 text-xs ${project.featured ? "bg-[rgba(0,245,255,0.12)] text-[var(--neon)]" : "bg-white/[0.04] text-[var(--text-muted)]"}`}>
                    {project.featured ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">{project.order_num}</td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">
                  {new Date(project.updated_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/dashboard/projects/${project.id}/edit`}
                      className="focus-ring inline-flex size-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:text-white"
                    >
                      <Edit size={15} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(project.id)}
                      className="focus-ring inline-flex size-9 items-center justify-center rounded-full border border-[rgba(239,68,68,0.24)] text-[var(--danger)] hover:bg-[rgba(239,68,68,0.08)]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </GlassCard>
  );
}
