import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AdminUtamaDashboard } from "@/components/dashboard/AdminUtamaDashboard";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSummaryForOPD } from "@/lib/actions/dashboard.actions";
import { FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProgressGauge } from "@/components/charts/ProgressGauge";
import { ComplianceBadge } from "@/components/dashboard/ComplianceBadge";
import { AreaBarChart } from "@/components/charts/AreaBarChart";
import { AreaRadarChart } from "@/components/charts/AreaRadarChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

async function AdminOPDDashboard({ user }: { user: { email: string; role: string; opdName?: string | null } }) {
  const opdName = user.opdName ?? "";
  const data = await getDashboardSummaryForOPD(opdName);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Total Target Dokumen"
          value={data.totalTarget.toLocaleString("id-ID")}
          subtitle="Dokumen MCSP yang harus dipenuhi"
          icon={<FileText />}
          variant="primary"
        />
        <StatCard
          title="Total Terpenuhi"
          value={data.totalTerpenuhi.toLocaleString("id-ID")}
          subtitle={data.rasioTeks + " dokumen dikumpulkan"}
          icon={<CheckCircle2 />}
          variant="success"
        />
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-200/70">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Persentase Kepatuhan
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <ProgressGauge
                    persentase={data.persentase}
                    size={110}
                    label="Kepatuhan"
                  />
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Status</p>
                      <ComplianceBadge
                        persentase={data.persentase}
                        size="md"
                      />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-[180px]">
                      {data.statusKepatuhan === "Optimal"
                        ? "Target kepatuhan tercapai, pertahankan!"
                        : data.statusKepatuhan === "Dalam Proses"
                        ? "Perlu akselerasi pemenuhan dokumen"
                        : "Perlu intervensi dan perhatian khusus"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 shrink-0">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Status Kepatuhan OPD
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {opdName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <ComplianceBadge
                persentase={data.persentase}
                size="lg"
                showPercentage={true}
              />
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Rasio</p>
                <p className="font-mono font-extrabold text-lg text-slate-800">
                  {data.rasioTeks}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-6">
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">
              Progres Per Area Strategis
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Visualisasi pemenuhan dokumen per 7 area MCSP
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <AreaBarChart data={data.progresPerArea} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">
              Radar Kepatuhan 7 Area
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Peta kekuatan dan kelemahan per area strategis
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <AreaRadarChart data={data.progresPerArea} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">
            Rincian Pemenuhan per Area
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Target vs Pemenuhan per 7 Area Strategis MCSP
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-14 text-center font-bold text-slate-600">No</TableHead>
                  <TableHead className="font-bold text-slate-600">Nama Area Strategis</TableHead>
                  <TableHead className="text-center font-bold text-slate-600">Target</TableHead>
                  <TableHead className="text-center font-bold text-slate-600">Terpenuhi</TableHead>
                  <TableHead className="text-center font-bold text-slate-600">Persentase</TableHead>
                  <TableHead className="text-center font-bold text-slate-600">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.progresPerArea.map((area, idx) => (
                  <TableRow key={area.areaId}>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                        {idx + 1}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-800 text-sm">
                      {area.areaName}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm text-slate-700 font-bold">
                      {area.target}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm text-emerald-700 font-bold">
                      {area.terpenuhi}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "font-extrabold text-sm",
                          area.persentase >= 80 && "text-emerald-700",
                          area.persentase >= 40 && area.persentase < 80 && "text-amber-700",
                          area.persentase < 40 && "text-rose-700"
                        )}
                      >
                        {area.persentase.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <ComplianceBadge persentase={area.persentase} size="sm" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell
      title={user.role === "ADMIN_UTAMA" ? "Dashboard Admin Utama" : "Dashboard OPD Saya"}
    >
      {user.role === "ADMIN_UTAMA" ? (
        <AdminUtamaDashboard />
      ) : (
        <AdminOPDDashboard user={user} />
      )}
    </AppShell>
  );
}
