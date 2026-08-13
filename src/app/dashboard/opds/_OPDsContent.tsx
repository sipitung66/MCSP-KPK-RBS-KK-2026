"use client";

import { useState, Fragment } from "react";
import {
  Building2,
  Loader2,
  Search,
  Filter,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getSubmissionsByOPD } from "@/lib/actions/submissions.actions";
import type { Submission, OPDList } from "@prisma/client";
import type { DashboardSummary } from "@/lib/actions/dashboard.actions";
import { OPDBarChart } from "@/components/charts/OPDBarChart";
import { ComplianceBadge } from "@/components/dashboard/ComplianceBadge";
import { ProgressGauge } from "@/components/charts/ProgressGauge";

type SortKey = "name" | "persentase" | "terpenuhi" | "belum";
type SortDir = "asc" | "desc";

interface OPDsContentProps {
  opds: OPDList[];
  summary: DashboardSummary;
}

interface SortIconProps {
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}

function SortIcon({ col, sortKey, sortDir }: SortIconProps) {
  if (sortKey !== col) return null;
  if (sortDir === "asc") {
    return <TrendingUp className="w-3.5 h-3.5 inline ml-1 text-indigo-600" />;
  }
  return <TrendingDown className="w-3.5 h-3.5 inline ml-1 text-indigo-600" />;
}

export function OPDsContent({ opds, summary }: OPDsContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("persentase");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedOPD, setExpandedOPD] = useState<string | null>(null);
  const [opdSubmissions, setOpdSubmissions] = useState<Submission[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [minFilter, setMinFilter] = useState<"all" | "kritis" | "proses" | "optimal">("all");

  const handleToggleOPD = async (opdName: string) => {
    if (expandedOPD === opdName) {
      setExpandedOPD(null);
      return;
    }
    setExpandedOPD(opdName);
    setDetailLoading(true);
    try {
      const subs = await getSubmissionsByOPD(opdName);
      setOpdSubmissions(subs);
    } finally {
      setDetailLoading(false);
    }
  };

  const rasioOPD = summary?.rasioOPD ?? [];

  const filteredRasio = rasioOPD
    .filter((o) => {
      if (searchTerm && !o.opdName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (minFilter === "kritis" && !(o.persentase < 40)) return false;
      if (minFilter === "proses" && !(o.persentase >= 40 && o.persentase < 80)) return false;
      if (minFilter === "optimal" && !(o.persentase >= 80)) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.opdName.localeCompare(b.opdName); break;
        case "persentase": cmp = a.persentase - b.persentase; break;
        case "terpenuhi": cmp = a.terpenuhi - b.terpenuhi; break;
        case "belum": cmp = (a.target - a.terpenuhi) - (b.target - b.terpenuhi); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalStats = {
    optimal: rasioOPD.filter((o) => o.persentase >= 80).length,
    proses: rasioOPD.filter((o) => o.persentase >= 40 && o.persentase < 80).length,
    kritis: rasioOPD.filter((o) => o.persentase < 40).length,
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                  OPD Optimal (≥80%)
                </p>
                <p className="text-3xl font-extrabold text-emerald-800 mt-2">
                  {totalStats.optimal}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  OPD dengan kepatuhan tinggi
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
                  Dalam Proses (40-79%)
                </p>
                <p className="text-3xl font-extrabold text-amber-800 mt-2">
                  {totalStats.proses}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Perlu akselerasi pemenuhan
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">
                  Perlu Intervensi ({`<`}40%)
                </p>
                <p className="text-3xl font-extrabold text-rose-800 mt-2">
                  {totalStats.kritis}
                </p>
                <p className="text-xs text-rose-600 mt-1">
                  Prioritas pembinaan & pendampingan
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-rose-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Visualisasi Peringkat Kepatuhan OPD
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Diurutkan dari persentase kepatuhan tertinggi
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <OPDBarChart data={[...rasioOPD].sort((a, b) => b.persentase - a.persentase)} />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-br from-indigo-50/50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Daftar Rincian Kepatuhan OPD
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Total {filteredRasio.length} dari {rasioOPD.length} OPD — Klik baris untuk rincian
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari nama OPD..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={minFilter}
            onValueChange={(v) => setMinFilter(v as typeof minFilter)}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="optimal">✓ Optimal (≥80%)</SelectItem>
              <SelectItem value="proses">○ Dalam Proses (40-79%)</SelectItem>
              <SelectItem value="kritis">⚠ Perlu Intervensi ({`<`}40%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CardContent className="p-0">
          {filteredRasio.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">Tidak ada OPD ditemukan</p>
              <p className="text-sm mt-1">Coba ubah filter pencarian.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="w-14 text-center font-bold text-slate-600">#</TableHead>
                    <TableHead
                      className="font-bold text-slate-600 cursor-pointer select-none hover:text-indigo-700"
                      onClick={() => toggleSort("name")}
                    >
                      Nama OPD <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                    </TableHead>
                    <TableHead
                      className="w-36 text-center font-bold text-slate-600 cursor-pointer select-none hover:text-indigo-700"
                      onClick={() => toggleSort("terpenuhi")}
                    >
                      Terpenuhi <SortIcon col="terpenuhi" sortKey={sortKey} sortDir={sortDir} />
                    </TableHead>
                    <TableHead
                      className="w-36 text-center font-bold text-slate-600 cursor-pointer select-none hover:text-indigo-700"
                      onClick={() => toggleSort("belum")}
                    >
                      Belum <SortIcon col="belum" sortKey={sortKey} sortDir={sortDir} />
                    </TableHead>
                    <TableHead
                      className="w-36 text-center font-bold text-slate-600 cursor-pointer select-none hover:text-indigo-700"
                      onClick={() => toggleSort("persentase")}
                    >
                      Persentase <SortIcon col="persentase" sortKey={sortKey} sortDir={sortDir} />
                    </TableHead>
                    <TableHead className="w-32 text-center font-bold text-slate-600">Status</TableHead>
                    <TableHead className="w-20 text-center font-bold text-slate-600">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRasio.map((opd, idx) => (
                    <Fragment key={opd.opdName}>
                      <TableRow
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-indigo-50/40",
                          expandedOPD === opd.opdName && "bg-indigo-50/60"
                        )}
                        onClick={() => handleToggleOPD(opd.opdName)}
                      >
                        <TableCell className="text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold",
                            idx < 3 && "bg-amber-100 text-amber-800",
                            idx >= 3 && "bg-slate-100 text-slate-700"
                          )}>
                            {idx + 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-800 text-sm">
                              {opd.opdName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-bold text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                            {opd.terpenuhi}/{opd.target}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-bold text-sm text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md">
                            {opd.target - opd.terpenuhi}
                          </span>
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
                          <div className="hidden sm:block w-28 mx-auto mt-1.5">
                            <Progress
                              value={opd.persentase}
                              className={cn(
                                "h-1.5 rounded-full",
                                opd.persentase >= 80 && "[&>div]:bg-emerald-500",
                                opd.persentase >= 40 && opd.persentase < 80 && "[&>div]:bg-amber-500",
                                opd.persentase < 40 && "[&>div]:bg-rose-500"
                              )}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <ComplianceBadge persentase={opd.persentase} size="sm" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-indigo-100 hover:text-indigo-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleOPD(opd.opdName);
                            }}
                          >
                            {expandedOPD === opd.opdName ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedOPD === opd.opdName && (
                        <TableRow className="bg-slate-50/80 border-t-0">
                          <TableCell colSpan={7} className="p-4 sm:p-6">
                            {detailLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
                                <span className="text-sm text-slate-500">Memuat rincian...</span>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
                                  <ProgressGauge persentase={opd.persentase} size={90} label="Kepatuhan" />
                                  <div className="flex-1 min-w-[200px]">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                      Ringkasan {opd.opdName}
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                                      <div>
                                        <p className="text-[11px] text-slate-500">Target</p>
                                        <p className="text-lg font-bold text-slate-800 font-mono">{opd.target}</p>
                                      </div>
                                      <div>
                                        <p className="text-[11px] text-slate-500">Terpenuhi</p>
                                        <p className="text-lg font-bold text-emerald-700 font-mono">{opd.terpenuhi}</p>
                                      </div>
                                      <div>
                                        <p className="text-[11px] text-slate-500">Belum</p>
                                        <p className="text-lg font-bold text-rose-700 font-mono">{opd.target - opd.terpenuhi}</p>
                                      </div>
                                      <div>
                                        <p className="text-[11px] text-slate-500">Persentase</p>
                                        <p className={cn(
                                          "text-lg font-bold font-mono",
                                          opd.persentase >= 80 && "text-emerald-700",
                                          opd.persentase >= 40 && opd.persentase < 80 && "text-amber-700",
                                          opd.persentase < 40 && "text-rose-700"
                                        )}>{opd.persentase.toFixed(1)}%</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                  <Table>
                                    <TableHeader className="bg-slate-50">
                                      <TableRow>
                                        <TableHead className="w-12 text-center font-bold text-slate-600 text-xs">#</TableHead>
                                        <TableHead className="font-bold text-slate-600 text-xs">Area</TableHead>
                                        <TableHead className="font-bold text-slate-600 text-xs">Nama Dokumen</TableHead>
                                        <TableHead className="w-32 text-center font-bold text-slate-600 text-xs">Status</TableHead>
                                        <TableHead className="w-28 text-center font-bold text-slate-600 text-xs">Berkas</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {opdSubmissions
                                        .filter((s) => s.opdName === opd.opdName)
                                        .map((s, i) => (
                                          <TableRow key={s.id}>
                                            <TableCell className="text-center text-xs text-slate-500 font-bold">
                                              {i + 1}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-600">
                                              Area {s.areaId}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-800">
                                              <div className="font-medium">{s.documentName}</div>
                                              {s.note && (
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                  Catatan: {s.note}
                                                </div>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <Badge
                                                variant={s.status === "TERPENUHI" ? "success" : "secondary"}
                                                className={cn(
                                                  "text-[11px] font-semibold",
                                                  s.status === "TERPENUHI"
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-slate-100 text-slate-700"
                                                )}
                                              >
                                                {s.status === "TERPENUHI" ? (
                                                  <span className="flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Terpenuhi
                                                  </span>
                                                ) : (
                                                  "Belum"
                                                )}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              {s.fileUrl ? (
                                                <a
                                                  href={s.fileUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-[11px] text-indigo-600 hover:text-indigo-800 underline font-semibold inline-flex items-center gap-1"
                                                >
                                                  <FileText className="w-3 h-3" /> Lihat
                                                </a>
                                              ) : (
                                                <span className="text-[11px] text-slate-400 italic">—</span>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
