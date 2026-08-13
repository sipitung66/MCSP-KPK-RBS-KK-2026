"use client";

import {
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  Target,
  Award,
  BarChart3,
  Flag,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Submission } from "@prisma/client";
import type { OPDSpecificSummary } from "@/lib/actions/dashboard.actions";
import { ProgressGauge } from "@/components/charts/ProgressGauge";
import { ComplianceBadge } from "@/components/dashboard/ComplianceBadge";
import { AreaBarChart } from "@/components/charts/AreaBarChart";
import { AreaRadarChart } from "@/components/charts/AreaRadarChart";

interface ProgressContentProps {
  summary: OPDSpecificSummary;
  submissions: Submission[];
}

function getSisaHari() {
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  return Math.max(0, Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function ProgressContent({ summary, submissions }: ProgressContentProps) {
  const sisaHari = getSisaHari();
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white shadow-xl">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/15 text-white border border-white/20 backdrop-blur-sm">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" /> {today}
                </Badge>
                <Badge className="bg-amber-400/20 text-amber-100 border border-amber-300/30 font-bold">
                  <Clock className="w-3.5 h-3.5 mr-1.5" /> Sisa {sisaHari} Hari
                </Badge>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {summary.opdName}
                </h2>
                <p className="text-indigo-100 mt-1 text-sm sm:text-base max-w-xl">
                  Mari kita capai target kepatuhan MCSP KPK 2026!
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 border border-white/10">
                  <Target className="w-4 h-4 text-amber-300" />
                  <span className="text-xs text-white/90">Target</span>
                  <span className="text-sm font-extrabold">{summary.totalTarget}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span className="text-xs text-white/90">Terpenuhi</span>
                  <span className="text-sm font-extrabold text-emerald-300">{summary.totalTerpenuhi}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 border border-white/10">
                  <Flag className="w-4 h-4 text-rose-300" />
                  <span className="text-xs text-white/90">Sisa</span>
                  <span className="text-sm font-extrabold text-rose-300">
                    {summary.totalTarget - summary.totalTerpenuhi}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5 shrink-0">
              <ProgressGauge
                persentase={summary.persentase}
                size={140}
                label="Progres Tahunan"
                strokeWidth={14}
              />
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-indigo-200 font-semibold uppercase">Status</p>
                  <ComplianceBadge persentase={summary.persentase} size="lg" showPercentage />
                </div>
                <div>
                  <p className="text-xs text-indigo-200 font-semibold">Rasio</p>
                  <p className="text-2xl font-extrabold font-mono text-white">{summary.rasioTeks}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <p className="text-xs text-indigo-100 font-semibold uppercase">
                Jalur Pencapaian Target
              </p>
              <p className="text-xs text-indigo-100 font-mono font-bold">
                {summary.persentase.toFixed(1)}%
              </p>
            </div>
            <Progress
              value={summary.persentase}
              className="h-3 rounded-full bg-white/15 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:via-emerald-300 [&>div]:to-emerald-400"
            />
            <div className="flex justify-between mt-2 text-[10px] text-indigo-200 font-medium">
              <span>0% Mulai</span>
              <span>40% Minimum</span>
              <span>80% Optimal</span>
              <span>100% Sempurna</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Total Terpenuhi</p>
                <p className="text-3xl font-extrabold text-emerald-700 mt-2 font-mono">
                  {summary.totalTerpenuhi}
                </p>
                <p className="text-xs text-emerald-600 mt-1">dokumen</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Belum Terpenuhi</p>
                <p className="text-3xl font-extrabold text-rose-700 mt-2 font-mono">
                  {summary.totalTarget - summary.totalTerpenuhi}
                </p>
                <p className="text-xs text-rose-600 mt-1">perlu dilengkapi</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-rose-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Target Total</p>
                <p className="text-3xl font-extrabold text-indigo-700 mt-2 font-mono">
                  {summary.totalTarget}
                </p>
                <p className="text-xs text-indigo-600 mt-1">dokumen 7 Area</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-indigo-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Status Saat Ini</p>
                <p className="text-3xl font-extrabold mt-2 font-mono">
                  <span className={cn(
                    summary.persentase >= 80 && "text-emerald-700",
                    summary.persentase >= 40 && summary.persentase < 80 && "text-amber-700",
                    summary.persentase < 40 && "text-rose-700"
                  )}>
                    {summary.persentase.toFixed(1)}%
                  </span>
                </p>
                <p className="text-xs text-slate-600 mt-1">{summary.statusKepatuhan}</p>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                summary.persentase >= 80 && "bg-emerald-100",
                summary.persentase >= 40 && summary.persentase < 80 && "bg-amber-100",
                summary.persentase < 40 && "bg-rose-100"
              )}>
                <Award className={cn(
                  "w-6 h-6",
                  summary.persentase >= 80 && "text-emerald-700",
                  summary.persentase >= 40 && summary.persentase < 80 && "text-amber-700",
                  summary.persentase < 40 && "text-rose-700"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-6">
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Progres per Area Strategis
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Visualisasi pemenuhan dokumen tiap area MCSP
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <AreaBarChart data={summary.progresPerArea} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Radar Kekuatan & Kelemahan
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Analisis 7 pilar area strategis MCSP
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <AreaRadarChart data={summary.progresPerArea} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-br from-emerald-50/60 via-white to-indigo-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" />
                Daftar Per Area — Prioritas Penyelesaian
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Fokus pada dokumen BELUM TERPENUHI terlebih dahulu
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit bg-white">
              Total {submissions.length} Item
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow>
                  <TableHead className="w-14 text-center font-bold text-xs">#</TableHead>
                  <TableHead className="font-bold text-xs">Area Strategis</TableHead>
                  <TableHead className="font-bold text-xs">Nama Dokumen</TableHead>
                  <TableHead className="w-28 text-center font-bold text-xs">Target</TableHead>
                  <TableHead className="w-28 text-center font-bold text-xs">Terpenuhi</TableHead>
                  <TableHead className="w-32 text-center font-bold text-xs">% Area</TableHead>
                  <TableHead className="w-36 text-center font-bold text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center text-slate-500">
                      <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold">Belum ada data submission</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  (() => {
                    const rows: {
                      areaId: number; areaName: string; target: number; terpenuhi: number;
                      doc: Submission; showArea: boolean; areaPersentase: number;
                    }[] = [];
                    summary.progresPerArea.forEach((a) => {
                      const list = submissions
                        .filter((s) => s.areaId === a.areaId)
                        .sort((x, y) => {
                          if (x.status === y.status) return x.documentName.localeCompare(y.documentName);
                          return x.status === "BELUM_TERPENUHI" ? -1 : 1;
                        });
                      list.forEach((doc, idx) => {
                        rows.push({
                          areaId: a.areaId,
                          areaName: a.areaName,
                          target: a.target,
                          terpenuhi: a.terpenuhi,
                          doc,
                          showArea: idx === 0,
                          areaPersentase: a.persentase,
                        });
                      });
                    });
                    return rows.map((row, idx) => (
                      <TableRow
                        key={row.doc.id}
                        className={cn(row.doc.status === "BELUM_TERPENUHI" && "bg-rose-50/40")}
                      >
                        <TableCell className="text-center text-xs text-slate-500 font-bold">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {row.showArea ? (
                            <span className="font-semibold text-slate-800">{row.areaName}</span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">↑ sama</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-start gap-2">
                            {row.doc.status === "BELUM_TERPENUHI" ? (
                              <Flag className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            )}
                            <div>
                              <p className={cn(
                                "font-medium leading-snug",
                                row.doc.status === "BELUM_TERPENUHI" ? "text-rose-800" : "text-slate-800"
                              )}>
                                {row.doc.documentName}
                              </p>
                              {row.doc.note && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Catatan: {row.doc.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm font-bold text-slate-700">
                          {row.showArea ? row.target : "—"}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm font-bold text-emerald-700">
                          {row.showArea ? row.terpenuhi : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.showArea ? (
                            <span className={cn(
                              "font-extrabold text-sm",
                              row.areaPersentase >= 80 && "text-emerald-700",
                              row.areaPersentase >= 40 && row.areaPersentase < 80 && "text-amber-700",
                              row.areaPersentase < 40 && "text-rose-700"
                            )}>
                              {row.areaPersentase.toFixed(1)}%
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.showArea ? (
                            <div className="flex justify-center">
                              <ComplianceBadge persentase={row.areaPersentase} size="sm" />
                            </div>
                          ) : (
                            <Badge
                              variant={row.doc.status === "TERPENUHI" ? "success" : "secondary"}
                              className={cn(
                                "text-[11px] font-semibold",
                                row.doc.status === "TERPENUHI"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-700"
                              )}
                            >
                              {row.doc.status === "TERPENUHI" ? "✓ OK" : "⚠ Prioritas"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ));
                  })()
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
