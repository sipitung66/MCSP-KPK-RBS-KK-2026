import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSummary, getAllOPDList } from "@/lib/actions/dashboard.actions";
import { OPDsContent } from "./_OPDsContent";

export default async function OPDsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN_UTAMA") redirect("/dashboard");

  const [opds, summary] = await Promise.all([
    getAllOPDList(),
    getDashboardSummary(),
  ]);

  return (
    <AppShell title="Rekapitulasi Per OPD" subtitle="Monitoring Kepatuhan per Organisasi Perangkat Daerah">
      <OPDsContent opds={opds} summary={summary} />
    </AppShell>
  );
}
