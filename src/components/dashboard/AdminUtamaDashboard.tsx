"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle2,
  Building2,
  BarChart3,
  Map as MapIcon,
  AlertTriangle,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/StatCard";
import { ComplianceBadge } from "@/components/dashboard/ComplianceBadge";
import { AreaBarChart } from "@/components/charts/AreaBarChart";
import { OPDBarChart } from "@/components/charts/OPDBarChart";
import { ProgressGauge } from "@/components/charts/ProgressGauge";
import { AreaRadarChart } from "@/components/charts/AreaRadarChart";
import { EWSPanel } from "@/components/dashboard/EWSPanel";
import { AreaProgressGrid } from "@/components/dashboard/AreaProgressGrid";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getDashboardSummary, type DashboardSummary } from "@/lib/actions/dashboard.actions";

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse",
        className
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-8 bg-slate-200 rounded w-2/3 mb-2" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  );
}

function SkeletonBlock({ className, lines = 6 }: { className?: string; lines?: number }) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-6 animate-pulse", className)}>
      <div className="h-5 bg-slate-200 rounded w-2/5 mb-5" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-slate-100 rounded w-full mb-2.5 last:w-3/4" />
      ))}
    </div>
  );
}

export function AdminUtamaDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const summary = await getDashboardSummary();
        if (mounted) {
          setData(summary);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed load dashboard:", err);
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonBlock lines={10} />
          <SkeletonBlock lines={10} />
        </div>
        <div className="flex items-center justify-center py-10">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="font-semibold">Memuat data dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  const { globalSummary, progresPerArea, rasioOPD, ews, totalOPD } = data;

  const sortedOPDForTable = [...rasioOPD].sort((a, b) => b.persentase - a.persentase);

  return (
    <div className="space-y-6">
      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Dokumen Target"
          value={globalSummary.totalTarget.toLocaleString("id-ID")}
          subtitle="Dokumen MCSP yang harus dipenuhi"
          icon={<FileText />}
          variant="primary"
        />
        <StatCard
          title="Total Terpenuhi"
          value={globalSummary.totalTerpenuhi.toLocaleString("id-ID")}
          subtitle={globalSummary.ratioText + " dokumen dikumpulkan"}
          icon={<CheckCircle2 />}
          variant="success"
        />
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-200/70">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Persentase Kumulatif
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <ProgressGauge
                    persentase={globalSummary.persentase}
                    size={110}
                    label="Kepatuhan"
                  />
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Status</p>
                      <ComplianceBadge
                        persentase={globalSummary.persentase}
                        size="md"
                      />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-[180px]">
                      {globalSummary.status === "Optimal"
                        ? "Target kepatuhan tercapai, pertahankan!"
                        : globalSummary.status === "Dalam Proses"
                        ? "Perlu akselerasi pemenuhan dokumen"
                        : "Perlu intervensi dan perhatian khusus"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <StatCard
          title="Total OPD Terdaftar"
          value={totalOPD}
          subtitle="Organisasi Perangkat Daerah terdaftar"
          icon={<Building2 />}
          variant="warning"
        />
      </div>

      {/* Jumbo Compliance Badge */}
      <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 shrink-0">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Status Kepatuhan Kumulatif Nasional
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Rekapitulasi seluruh OPD dan Area Strategis MCSP
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <ComplianceBadge
                persentase={globalSummary.persentase}
                size="lg"
                showPercentage={true}
              />
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Rasio</p>
                <p className="font-mono font-extrabold text-lg text-slate-800">
                  {globalSummary.ratioText}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 2: Main Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 border-b border-slate-100">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex h-auto p-1 bg-slate-100">
              <TabsTrigger
                value="overview"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-white rounded-md gap-1.5"
              >
                <BarChart3 className="w-4 h-4 hidden sm:inline" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="area"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-white rounded-md gap-1.5"
              >
                <MapIcon className="w-4 h-4 hidden sm:inline" />
                Area
              </TabsTrigger>
              <TabsTrigger
                value="opd"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-white rounded-md gap-1.5"
              >
                <Building2 className="w-4 h-4 hidden sm:inline" />
                OPD
              </TabsTrigger>
              <TabsTrigger
                value="ews"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-white rounded-md gap-1.5"
              >
                <AlertTriangle className="w-4 h-4 hidden sm:inline" />
                EWS
              </TabsTrigger>
            </TabsList>

            <div className="pt-5 pb-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-6">
                  <Card className="border-slate-200 shadow-none">
                    <CardContent className="p-5 sm:p-6">
                      <AreaBarChart data={progresPerArea} />
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-none">
                    <CardContent className="p-5 sm:p-6">
                      <OPDBarChart data={rasioOPD} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="area" className="mt-0">
                <AreaProgressGrid data={progresPerArea} />
              </TabsContent>

              <TabsContent value="opd" className="mt-0 space-y-6">
                <Card className="border-slate-200 shadow-none">
                  <CardContent className="p-5 sm:p-6">
                    <OPDBarChart data={rasioOPD} />
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-none overflow-hidden">
                  <CardContent className="p-0">
                    <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">
                          Tabel Rincian Kepatuhan OPD
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Diurutkan berdasarkan persentase kepatuhan tertinggi
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                        Total {sortedOPDForTable.length} OPD
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="w-14 text-center font-bold text-slate-600">No</TableHead>
                            <TableHead className="font-bold text-slate-600">Nama OPD</TableHead>
                            <TableHead className="text-center font-bold text-slate-600">Rasio</TableHead>
                            <TableHead className="text-center font-bold text-slate-600">Persentase</TableHead>
                            <TableHead className="text-center font-bold text-slate-600">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedOPDForTable.map((opd, idx) => (
                            <TableRow key={opd.opdName}>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                                  {idx + 1}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium text-slate-800 text-sm max-w-[340px]">
                                {opd.opdName}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm text-slate-700 font-bold">
                                {opd.terpenuhi} / {opd.target}
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={cn(
                                    "font-extrabold text-sm",
                                    opd.persentase >= 80 && "text-emerald-700",
                                    opd.persentase >= 40 && opd.persentase < 80 && "text-amber-700",
                                    opd.persentase < 40 && "text-rose-700"
                                  )}
                                >
                                  {opd.persentase.toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center">
                                  <ComplianceBadge persentase={opd.persentase} size="sm" />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ews" className="mt-0">
                <EWSPanel ews={ews} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Row 3: Radar + Area List */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 xl:gap-6">
        <Card className="border-slate-200 shadow-sm xl:col-span-2 overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-800">
                Ringkasan 7 Area Strategis
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detail per area dengan target dan pemenuhan
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-10 text-center font-bold text-slate-600">#</TableHead>
                    <TableHead className="font-bold text-slate-600">Area</TableHead>
                    <TableHead className="text-center font-bold text-slate-600">Tgt</TableHead>
                    <TableHead className="text-center font-bold text-slate-600">Trp</TableHead>
                    <TableHead className="text-center font-bold text-slate-600">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progresPerArea.map((a, i) => (
                    <TableRow key={a.areaId}>
                      <TableCell className="text-center">
                        <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800 max-w-[200px]">
                        {a.areaName}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold text-slate-600">
                        {a.target}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold text-emerald-700">
                        {a.terpenuhi}
                      </TableCell>
                      <TableCell className="text-center">
                        <ComplianceBadge
                          persentase={a.persentase}
                          size="sm"
                          showPercentage={true}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm xl:col-span-3 overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <AreaRadarChart data={progresPerArea} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
