import type { Metadata } from "next";
import { Toaster } from "sonner";
import "@/app/globals.css";
import { legacyMono } from "@/app/fonts";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Background } from "@/components/ui/Background";

export const metadata: Metadata = {
  title: "Dashboard — Mohammed Salha",
  robots: { index: false, follow: false }
};

// Root layout for the dashboard: English, left-to-right (P3-2, D-026).
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={legacyMono.variable}>
        <div className="min-h-screen">
          <Background />
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:pb-8 md:pl-72 md:pr-8">
              {children}
            </main>
          </div>
          <Toaster richColors position="bottom-right" />
        </div>
      </body>
    </html>
  );
}
