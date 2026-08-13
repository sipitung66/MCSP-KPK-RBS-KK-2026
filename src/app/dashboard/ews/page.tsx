import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/actions/dashboard.actions";
import { EWSContent } from "./_EWSContent";

export default async function EWSPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN_UTAMA") redirect("/dashboard");

  const summary = await getDashboardSummary();

  return (
    <AppShell title="Early Warning System (EWS)" subtitle="Peringatan dini OPD dan Area Strategis dengan risiko tertinggi">
      <EWSContent summary={summary} />
    </AppShell>
  );
}
