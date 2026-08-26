import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export async function AppShell({
  children,
  title = "Dashboard",
  subtitle,
}: AppShellProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const defaultSubtitle =
    subtitle ??
    (user.role === "ADMIN_UTAMA"
      ? "Pusat Pengendalian Monitoring & Evaluasi MCSP KPK"
      : user.opdName ?? "Dashboard OPD");

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Sidebar user={user} />
      <Header title={title} subtitle={defaultSubtitle} user={user} />
      <main className="lg:ml-64 pt-28 lg:pt-20 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
