"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FolderKanban, LogOut, Plus, Settings } from "lucide-react";
import { logoutAction } from "@/actions/auth";

const items = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/projects/new", label: "Add Project", icon: Plus },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-black/75 p-2 backdrop-blur-xl md:bottom-auto md:right-auto md:top-0 md:h-screen md:w-64 md:border-r md:border-t-0 md:p-5">
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[var(--border-neon)] text-[var(--neon)]">
            <span className="font-duran text-xl font-black">MS</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Portfolio</p>
            <p className="text-xs text-[var(--text-muted)]">Control room</p>
          </div>
        </div>

        <nav className="grid grid-cols-4 gap-2 md:mt-10 md:flex md:flex-col">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`focus-ring flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl border px-3 text-[11px] transition md:flex-row md:justify-start md:text-sm ${
                  active
                    ? "border-[var(--border-neon)] bg-[rgba(0,245,255,0.1)] text-white"
                    : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:text-white"
                }`}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
          <form action={logoutAction} className="md:mt-auto">
            <button
              type="submit"
              className="focus-ring flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-2xl border border-transparent px-3 text-[11px] text-[var(--text-secondary)] transition hover:border-[var(--border)] hover:text-white md:flex-row md:justify-start md:text-sm"
            >
              <LogOut size={17} />
              Logout
            </button>
          </form>
        </nav>
      </aside>
    </>
  );
}
