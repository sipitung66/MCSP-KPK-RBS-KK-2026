import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSummary, getAllAreas } from "@/lib/actions/dashboard.actions";
import { AreasContent } from "./_AreasContent";

export default async function AreasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN_UTAMA") redirect("/dashboard");

  const [areas, summary] = await Promise.all([
    getAllAreas(),
    getDashboardSummary(),
  ]);

  return (
    <AppShell title="Rekapitulasi Per Area Strategis" subtitle="Monitoring detail per 7 Area Strategis MCSP">
      <AreasContent areas={areas} summary={summary} />
    </AppShell>
  );
}
