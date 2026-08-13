"use client";

import { useState } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
  Loader2,
  RefreshCw,
  Send,
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardSummary } from "@/lib/actions/dashboard.actions";
import type { DashboardSummary } from "@/lib/actions/dashboard.actions";
import { EWSPanel } from "@/components/dashboard/EWSPanel";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface EWSContentProps {
  summary: DashboardSummary;
}

export function EWSContent({ summary: initialSummary }: EWSContentProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const data = await getDashboardSummary();
      setSummary(data);
      toast({
        title: "Data Diperbarui",
        description: "Data EWS berhasil dimuat ulang.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotify = (opdName: string, type: "wa" | "email" | "surat") => {
    const typeLabel = type === "wa" ? "WhatsApp" : type === "email" ? "Email" : "Surat Elektronik";
    toast({
      title: `Notifikasi ${typeLabel} Dikirim`,
      description: `Peringatan dini telah dikirim ke ${opdName} melalui ${typeLabel}.`,
    });
  };

  const stats = {
    krisis: summary.ews.opdTerendah.filter((o) => o.persentase < 40).length,
    peringatan: summary.ews.opdTerendah.filter((o) => o.persentase >= 40 && o.persentase < 60).length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">
                  OPD Krisis
                </p>
                <p className="text-3xl font-extrabold text-rose-800 mt-2">
                  {stats.krisis}
                </p>
                <p className="text-xs text-rose-600 mt-1">
                  Kepatuhan &lt; 40% - perlu segera
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6 text-rose-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-700 mb-1">
                  OPD Peringatan
                </p>
                <p className="text-3xl font-extrabold text-orange-800 mt-2">
                  {stats.peringatan}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Kepatuhan 40-60% - pendampingan
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
                  Total OPD Terpantau
                </p>
                <p className="text-3xl font-extrabold text-amber-800 mt-2">
                  {summary.ews.opdTerendah.length}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  OPD di bawah ambang 60%
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1">
                  Aksi Terakhir
                </p>
                <p className="text-lg font-extrabold text-indigo-800 mt-2">
                  {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2 h-7 text-xs gap-1"
                  onClick={loadData}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
                  )}
                  Perbarui Data
                </Button>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <RefreshCw className={cn("w-6 h-6 text-indigo-700", refreshing && "animate-spin")} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EWSPanel ews={summary.ews} />

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-br from-rose-50/40 via-amber-50/30 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Send className="w-5 h-5 text-rose-600" />
                Pusat Aksi Cepat — Kirim Notifikasi ke OPD Tertinggal
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Kirim peringatan dini langsung ke Admin OPD
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          {summary.ews.opdTerendah.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <AlertOctagon className="w-10 h-10 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-emerald-800">
                Tidak ada OPD masuk kategori Peringatan Dini
              </p>
              <p className="text-sm text-slate-500 mt-2 max-w-md">
                Semua OPD telah mencapai tingkat kepatuhan di atas 60%.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {summary.ews.opdTerendah.slice(0, 6).map((opd, idx) => (
                <div
                  key={opd.opdName}
                  className={cn(
                    "p-5 rounded-xl border bg-white hover:shadow-md transition-all",
                    opd.persentase < 40
                      ? "border-rose-200 hover:border-rose-400"
                      : "border-amber-200 hover:border-amber-400"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-extrabold shrink-0",
                        opd.persentase < 40
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                          {opd.opdName}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge
                            variant={opd.persentase < 40 ? "destructive" : "secondary"}
                            className="text-[11px] font-semibold"
                          >
                            {opd.persentase < 40 ? "KRISIS" : "PERINGATAN"}
                          </Badge>
                          <span className="text-xs font-mono font-bold text-slate-600">
                            {opd.terpenuhi}/{opd.target} = {opd.persentase.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => handleNotify(opd.opdName, "wa")}
                    >
                      <Phone className="w-3.5 h-3.5" /> WhatsApp
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => handleNotify(opd.opdName, "email")}
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => handleNotify(opd.opdName, "surat")}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Surat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
