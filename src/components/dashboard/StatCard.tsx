"use client";

import { cloneElement, isValidElement, type ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type StatVariant = "default" | "primary" | "success" | "warning" | "danger";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: number;
  variant?: StatVariant;
}

const variantStyles: Record<StatVariant, { iconBg: string; iconText: string; accentBorder: string; trendBadge: string }> = {
  default: {
    iconBg: "bg-slate-100",
    iconText: "text-slate-700",
    accentBorder: "border-slate-200",
    trendBadge: "bg-slate-100 text-slate-700",
  },
  primary: {
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-700",
    accentBorder: "border-indigo-200",
    trendBadge: "bg-indigo-100 text-indigo-700",
  },
  success: {
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-700",
    accentBorder: "border-emerald-200",
    trendBadge: "bg-emerald-100 text-emerald-700",
  },
  warning: {
    iconBg: "bg-amber-100",
    iconText: "text-amber-700",
    accentBorder: "border-amber-200",
    trendBadge: "bg-amber-100 text-amber-700",
  },
  danger: {
    iconBg: "bg-rose-100",
    iconText: "text-rose-700",
    accentBorder: "border-rose-200",
    trendBadge: "bg-rose-100 text-rose-700",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const styles = variantStyles[variant];
  const isPositive = (trend ?? 0) >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const iconClassName = "w-6 h-6 sm:w-7 sm:h-7";
  const renderedIcon = isValidElement(icon)
    ? cloneElement(icon as React.ReactElement<any>, { className: cn((icon as any).props?.className, iconClassName) })
    : icon;

  return (
    <div
      className={cn(
        "group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-200/70",
        styles.accentBorder
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity",
          variant === "primary" && "bg-gradient-to-r from-indigo-500 to-indigo-400",
          variant === "success" && "bg-gradient-to-r from-emerald-500 to-emerald-400",
          variant === "warning" && "bg-gradient-to-r from-amber-500 to-amber-400",
          variant === "danger" && "bg-gradient-to-r from-rose-500 to-rose-400",
          variant === "default" && "bg-gradient-to-r from-slate-500 to-slate-400"
        )}
      />

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {title}
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">
                {value}
              </p>
              {trend !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold",
                    styles.trendBadge
                  )}
                >
                  <TrendIcon className="w-3 h-3" />
                  {isPositive ? "+" : ""}
                  {trend.toFixed(1)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl shrink-0 shadow-inner",
              styles.iconBg,
              styles.iconText
            )}
          >
            {renderedIcon}
          </div>
        </div>
      </div>
    </div>
  );
}
