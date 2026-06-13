import { Toaster } from "sonner";
import { Background } from "@/components/ui/Background";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}
