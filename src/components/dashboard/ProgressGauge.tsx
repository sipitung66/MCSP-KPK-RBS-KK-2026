"use client";

import { cn } from "@/lib/utils";
import { getStatusKepatuhan, type ComplianceStatus } from "@/lib/calculations";
import { CheckCircle2, Clock4, AlertOctagon } from "lucide-react";

interface ProgressGaugeProps {
  value: number;
  size?: "md" | "lg" | "jumbo";
  showStatus?: boolean;
  label?: string;
  subtitle?: string;
}

const colorMap: Record<ComplianceStatus, { stroke: string; text: string; bg: string; iconBg: string; Icon: typeof CheckCircle2 }> = {
  Optimal: {
    stroke: "#10b981",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    Icon: CheckCircle2,
  },
  "Dalam Proses": {
    stroke: "#f59e0b",
    text: "text-amber-700",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    Icon: Clock4,
  },
  "Belum Memadai": {
    stroke: "#f43f5e",
    text: "text-rose-700",
    bg: "bg-rose-50",
    iconBg: "bg-rose-100",
    Icon: AlertOctagon,
  },
};

const statusLabels: Record<ComplianceStatus, string> = {
  Optimal: "Optimal",
  "Dalam Proses": "Dalam Proses",
  "Belum Memadai": "Belum Memadai",
};

const sizeConfig = {
  md: {
    width: 180,
    strokeWidth: 14,
    valueText: "text-3xl",
    labelText: "text-sm",
    statusText: "text-xs",
  },
  lg: {
    width: 240,
    strokeWidth: 18,
    valueText: "text-5xl",
    labelText: "text-base",
    statusText: "text-sm",
  },
  jumbo: {
    width: 320,
    strokeWidth: 24,
    valueText: "text-7xl",
    labelText: "text-lg",
    statusText: "text-base",
  },
};

export function ProgressGauge({ value, size = "lg", showStatus = true, label, subtitle }: ProgressGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const status = getStatusKepatuhan(clamped);
  const colors = colorMap[status];
  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const Icon = colors.Icon;

  return (
    <div className={cn("flex flex-col items-center gap-4", colors.bg, "rounded-2xl p-6 shadow-sm border border-slate-200")}>
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg width={config.width} height={config.width} className="-rotate-90">
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={config.strokeWidth}
            fill="none"
          />
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-extrabold tracking-tight", colors.text, config.valueText)}>
            {clamped.toFixed(0)}
            <span className="text-2xl align-top font-bold ml-0.5">%</span>
          </span>
          {showStatus && (
            <span className={cn("font-bold mt-1", colors.text, config.statusText)}>
              {statusLabels[status]}
            </span>
          )}
        </div>
      </div>

      {label && (
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <div className={cn("p-1.5 rounded-lg", colors.iconBg)}>
              <Icon className={cn("w-4 h-4", colors.text)} />
            </div>
            <p className={cn("font-semibold text-slate-700", config.labelText)}>{label}</p>
          </div>
          {subtitle && (
            <p className="text-sm text-slate-500 leading-relaxed">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
