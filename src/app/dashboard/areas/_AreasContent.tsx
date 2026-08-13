"use client";

import { useState } from "react";
import {
  PieChart,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  Building2,
  Search,
  Filter,
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
import { cn } from "@/lib/utils";
import { getSubmissionsByArea } from "@/lib/actions/submissions.actions";
import type { MCSPArea, Submission, DocStatus } from "@prisma/client";
import type { DashboardSummary } from "@/lib/actions/dashboard.actions";
import { ProgressGauge } from "@/components/charts/ProgressGauge";
import { ComplianceBadge } from "@/components/dashboard/ComplianceBadge";
import { AreaProgressGrid } from "@/components/dashboard/AreaProgressGrid";

interface AreasContentProps {
  areas: MCSPArea[];
  summary: DashboardSummary;
}

export function AreasContent({ areas, summary }: AreasContentProps) {
  const [selectedArea, setSelectedArea] = useState<number | "all">(areas[0]?.id ?? "all");
  const [expandedArea, setExpandedArea] = useState<number | "all">(areas[0]?.id ?? "all");
  const [areaSubmissions, setAreaSubmissions] = useState<Submission[]>([]);
  const [searchOPD, setSearchOPD] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | DocStatus>("all");
  const [detailLoading, setDetailLoading] = useState(false);

  const handleAreaChange = async (areaId: number | "all") => {
    setSelectedArea(areaId);
    setExpandedArea(areaId);
    if (areaId !== "all") {
      setDetailLoading(true);
      try {
        const subs = await getSubmissionsByArea(areaId);
        setAreaSubmissions(subs);
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const filteredSubs = areaSubmissions.filter((s) => {
    if (searchOPD && !s.opdName.toLowerCase().includes(searchOPD.toLowerCase())) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {summary.progresPerArea.map((a) => (
          <Card
            key={a.areaId}
            className={cn(
              "border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden",
              (selectedArea === a.areaId || expandedArea === a.areaId) &&
                "ring-2 ring-indigo-500 border-indigo-300"
            )}
            onClick={() => handleAreaChange(a.areaId)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Area {a.areaId}
                  </p>
                  <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight mb-3">
                    {a.areaName}
                  </p>
                  <div className="flex items-center gap-2 text-xs mb-3">
                    <Badge variant="outline" className="font-mono bg-slate-50">
                      Target: {a.target}
                    </Badge>
                    <Badge variant="success" className="bg-emerald-50 text-emerald-700">
                      ✓ {a.terpenuhi}
                    </Badge>
                  </div>
                  <ComplianceBadge persentase={a.persentase} size="sm" showPercentage />
                </div>
                <ProgressGauge persentase={a.persentase} size={72} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-br from-indigo-50 to-white">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            Detail Progress Per Area
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Klik area di atas untuk melihat detail per OPD
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <AreaProgressGrid data={summary.progresPerArea} />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" />
                Rincian Dokumen Per OPD
                {selectedArea !== "all" && areas.find((a) => a.id === selectedArea) && (
                  <Badge variant="outline" className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-200">
                    Area {selectedArea}: {areas.find((a) => a.id === selectedArea)?.areaName}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Total {areaSubmissions.length} dokumen di area ini
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={String(selectedArea)}
                onValueChange={(v) => handleAreaChange(v === "all" ? "all" : Number(v))}
              >
                <SelectTrigger className="w-full sm:w-[280px]">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Pilih Area..." />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      Area {a.id}: {a.areaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {selectedArea !== "all" && (
          <>
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Cari nama OPD / dokumen..."
                  className="pl-9"
                  value={searchOPD}
                  onChange={(e) => setSearchOPD(e.target.value)}
                />
              </div>
              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as "all" | DocStatus)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="TERPENUHI">Terpenuhi</SelectItem>
                  <SelectItem value="BELUM_TERPENUHI">Belum Terpenuhi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CardContent className="p-0">
              {detailLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                </div>
              ) : filteredSubs.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold">Tidak ada data ditemukan</p>
                  <p className="text-sm mt-1">Coba ubah filter pencarian.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-14 text-center font-bold text-slate-600">No</TableHead>
                        <TableHead className="font-bold text-slate-600">Nama OPD</TableHead>
                        <TableHead className="font-bold text-slate-600">Nama Dokumen</TableHead>
                        <TableHead className="w-36 text-center font-bold text-slate-600">Status</TableHead>
                        <TableHead className="w-32 text-center font-bold text-slate-600">Berkas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubs.map((s, idx) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                              {idx + 1}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-slate-800 text-sm max-w-[300px]">
                            <div className="flex items-start gap-2">
                              <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                              <span>{s.opdName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-700">
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
                                "text-[11px] font-semibold px-2.5 py-1",
                                s.status === "TERPENUHI"
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                              )}
                            >
                              {s.status === "TERPENUHI" ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Terpenuhi
                                </span>
                              ) : (
                                "Belum Terpenuhi"
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {s.fileUrl ? (
                              <a
                                href={s.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800 underline font-semibold inline-flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                Lihat
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400 italic">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
