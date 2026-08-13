"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type EWSResult } from "@/lib/calculations";
import { ComplianceBadge } from "@/components/dashboard/ComplianceBadge";
import { AlertTriangle, AlertOctagon, TrendingDown, ExternalLink, Building2, Layers } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EWSPanelProps {
  ews: EWSResult;
}

export function EWSPanel({ ews }: EWSPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className={cn(
        "border border-slate-200 shadow-sm overflow-hidden",
        "bg-gradient-to-br from-rose-50 via-white to-white"
      )}>
        <CardHeader className="pb-4 border-b border-rose-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-rose-100 shadow-inner">
              <TrendingDown className="w-5.5 h-5.5 text-rose-600" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-rose-800 flex items-center gap-2">
                OPD Tertinggal
                <span className="inline-flex items-center justify-center h-6 min-w-[2rem] px-2 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-sm">
                  {ews.opdTerendah.length}
                </span>
              </CardTitle>
              <p className="text-xs text-rose-600 mt-0.5 font-medium">
                Persentase pemenuhan di bawah 60%
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-3">
          {ews.opdTerendah.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <AlertOctagon className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="font-bold text-emerald-700">Semua OPD sudah di atas 60%</p>
              <p className="text-sm text-slate-500 mt-1">Tidak ada OPD yang masuk kategori peringatan dini.</p>
            </div>
          ) : (
            ews.opdTerendah.map((opd, idx) => (
              <div
                key={opd.opdName}
                className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={cn(
                      "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold shrink-0 shadow-inner",
                      idx === 0 ? "bg-rose-100 text-rose-700" :
                      idx === 1 ? "bg-orange-100 text-orange-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                          {opd.opdName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 pl-6">
                        <span className="font-mono">{opd.terpenuhi}/{opd.target} dokumen</span>
                      </div>
                    </div>
                  </div>
                  <ComplianceBadge persentase={opd.persentase} size="sm" />
                </div>
                <div className="pl-10 space-y-2">
                  <Progress value={opd.persentase} className="h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      {opd.persentase.toFixed(1)}% terpenuhi
                    </span>
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Kurang {Math.max(opd.target - opd.terpenuhi, 0)} dokumen
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className={cn(
        "border border-slate-200 shadow-sm overflow-hidden",
        "bg-gradient-to-br from-amber-50 via-white to-white"
      )}>
        <CardHeader className="pb-4 border-b border-amber-100 bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-100 shadow-inner">
              <Layers className="w-5.5 h-5.5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-amber-800 flex items-center gap-2">
                Area Strategis dengan Gap Terbesar
              </CardTitle>
              <p className="text-xs text-amber-700 mt-0.5 font-medium">
                Area yang memerlukan perhatian khusus
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-3">
          {ews.areaGapTerbesar.slice(0, 7).map((area, idx) => (
            <div
              key={area.areaId}
              className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold shrink-0 shadow-inner",
                    idx === 0 ? "bg-rose-100 text-rose-700" :
                    idx === 1 ? "bg-orange-100 text-orange-700" :
                    idx === 2 ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-snug">
                      {area.areaName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono">{area.terpenuhi}/{area.target} dokumen</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Gap {area.gap}
                  </div>
                </div>
              </div>
              <div className="pl-10 space-y-2">
                <div className="flex items-center justify-between">
                  <Progress value={area.persentase} className="h-2 flex-1 mr-3" />
                  <span className="text-xs font-mono font-bold text-slate-700 shrink-0 w-14 text-right">
                    {area.persentase.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
