"use client";

import {
  FileText,
  ShoppingCart,
  Users,
  UserCheck,
  Package,
  Coins,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ComplianceBadge } from "@/components/dashboard/ComplianceBadge";
import { cn } from "@/lib/utils";
import type { AreaProgress } from "@/lib/calculations";

interface AreaProgressGridProps {
  data: AreaProgress[];
}

const areaIconMap: Record<number, { Icon: LucideIcon; bg: string; text: string; ring: string }> = {
  1: { Icon: FileText, bg: "bg-indigo-100", text: "text-indigo-700", ring: "ring-indigo-100" },
  2: { Icon: Coins, bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-100" },
  3: { Icon: ShoppingCart, bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-100" },
  4: { Icon: Users, bg: "bg-sky-100", text: "text-sky-700", ring: "ring-sky-100" },
  5: { Icon: UserCheck, bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-100" },
  6: { Icon: Package, bg: "bg-purple-100", text: "text-purple-700", ring: "ring-purple-100" },
  7: { Icon: Shield, bg: "bg-teal-100", text: "text-teal-700", ring: "ring-teal-100" },
};

function getProgressColor(pct: number): string {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

export function AreaProgressGrid({ data }: AreaProgressGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {data.map((area) => {
        const iconConfig = areaIconMap[area.areaId] ?? areaIconMap[1];
        const { Icon, bg, text, ring } = iconConfig;
        const progressColor = getProgressColor(area.persentase);

        return (
          <div
            key={area.areaId}
            className={cn(
              "group relative bg-white rounded-xl shadow-sm border border-slate-200/70 overflow-hidden",
              "hover:shadow-lg hover:border-slate-300 transition-all duration-300 cursor-default"
            )}
          >
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                area.persentase >= 80 && "bg-gradient-to-r from-emerald-500 to-emerald-400",
                area.persentase >= 40 && area.persentase < 80 && "bg-gradient-to-r from-amber-500 to-amber-400",
                area.persentase < 40 && "bg-gradient-to-r from-rose-500 to-rose-400"
              )}
            />

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ring-4",
                      bg,
                      text,
                      ring
                    )}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-800 leading-tight line-clamp-2">
                      {area.areaName}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium uppercase tracking-wide">
                      Area #{area.areaId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Progres Pemenuhan
                  </span>
                  <span
                    className={cn(
                      "text-xs font-extrabold font-mono",
                      area.persentase >= 80 && "text-emerald-700",
                      area.persentase >= 40 && area.persentase < 80 && "text-amber-700",
                      area.persentase < 40 && "text-rose-700"
                    )}
                  >
                    {area.persentase.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={area.persentase}
                  className={cn("h-2.5 bg-slate-100 [&>div]:transition-all [&>div]:duration-700")}
                />
                <style jsx>{`
                  :global(.area-progress-${area.areaId} [data-radix-progress-indicator]) {
                    background-color: ${progressColor.includes('emerald') ? '#10b981' : progressColor.includes('amber') ? '#f59e0b' : '#f43f5e'} !important;
                  }
                `}</style>
                <div className="mt-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", progressColor)}
                    style={{ width: `${Math.min(area.persentase, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                    Dokumen
                  </p>
                  <p className="font-mono font-bold text-sm text-slate-800">
                    <span className="text-emerald-600">{area.terpenuhi}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span>{area.target}</span>
                  </p>
                </div>
                <ComplianceBadge persentase={area.persentase} size="sm" showPercentage={false} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
