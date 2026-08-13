import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSummaryForOPD } from "@/lib/actions/dashboard.actions";
import { getSubmissionsByOPD } from "@/lib/actions/submissions.actions";
import { ProgressContent } from "./_ProgressContent";

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN_OPD") redirect("/dashboard");

  const opdName = user.opdName ?? "";
  const [summary, submissions] = await Promise.all([
    getDashboardSummaryForOPD(opdName),
    getSubmissionsByOPD(opdName || undefined),
  ]);

  return (
    <AppShell title="Progres Saya" subtitle="Monitoring progres pemenuhan dokumen OPD Anda">
      <ProgressContent summary={summary} submissions={submissions} />
    </AppShell>
  );
}
