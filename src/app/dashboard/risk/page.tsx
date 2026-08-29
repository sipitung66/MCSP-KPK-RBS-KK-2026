import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getAllAreas, getAllOPDList } from "@/lib/actions/dashboard.actions";
import { getRiskAssessments } from "@/lib/actions/risk.actions";
import { prisma } from "@/lib/prisma";
import { RiskContent } from "./_RiskContent";

export default async function RiskPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN_UTAMA") redirect("/dashboard");

  const [areas, opds, indicators, assessments] = await Promise.all([
    getAllAreas(),
    getAllOPDList(),
    prisma.mCSPIndicator.findMany({ orderBy: [{ areaId: "asc" }, { indicatorNo: "asc" }] }),
    getRiskAssessments(),
  ]);

  return (
    <AppShell title="Asesmen Risiko MCSP-RBS" subtitle="Penilaian substansi, red flags, dan mitigasi per indikator">
      <RiskContent areas={areas} opds={opds} indicators={indicators} initialAssessments={assessments} />
    </AppShell>
  );
}
