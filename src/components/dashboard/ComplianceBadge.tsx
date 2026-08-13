"use client";

import { CheckCircle2, Clock4, AlertOctagon } from "lucide-react";
import { getStatusKepatuhan, type ComplianceStatus } from "@/lib/calculations";
import { cn } from "@/lib/utils";

interface ComplianceBadgeProps {
  persentase: number;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

const badgeStyles: Record<
  ComplianceStatus,
  { container: string; text: string; border: string; icon: typeof CheckCircle2; iconClass: string; label: string }
> = {
  Optimal: {
    container: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    label: "Optimal",
  },
  "Dalam Proses": {
    container: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock4,
    iconClass: "text-amber-500",
    label: "Dalam Proses",
  },
  "Belum Memadai": {
    container: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: AlertOctagon,
    iconClass: "text-rose-500",
    label: "Belum Memadai",
  },
};

const sizeStyles = {
  sm: {
    container: "px-2.5 py-1 text-[11px]",
    icon: "w-3.5 h-3.5",
    gap: "gap-1.5",
  },
  md: {
    container: "px-3 py-1.5 text-xs",
    icon: "w-4 h-4",
    gap: "gap-2",
  },
  lg: {
    container: "px-4 py-2 text-sm",
    icon: "w-5 h-5",
    gap: "gap-2",
  },
};

export function ComplianceBadge({
  persentase,
  showPercentage = true,
  size = "md",
}: ComplianceBadgeProps) {
  const status = getStatusKepatuhan(persentase);
  const styles = badgeStyles[status];
  const sz = sizeStyles[size];
  const Icon = styles.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold rounded-full border shadow-sm",
        styles.container,
        styles.text,
        styles.border,
        sz.container,
        sz.gap
      )}
    >
      <Icon className={cn("shrink-0", sz.icon, styles.iconClass)} />
      <span className="truncate">{styles.label}</span>
      {showPercentage && (
        <span
          className={cn(
            "font-mono font-extrabold opacity-90",
            size === "sm" && "text-[10px]",
            size === "md" && "text-[11px]",
            size === "lg" && "text-xs"
          )}
        >
          {persentase.toFixed(1)}%
        </span>
      )}
    </span>
  );
}
