"use client";

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface ProgressGaugeProps {
  persentase: number;
  size?: number;
  label?: string;
  strokeWidth?: number;
}

function getTrackColor(pct: number): string {
  if (pct >= 80) return "#10b981";
  if (pct >= 40) return "#f59e0b";
  return "#f43f5e";
}

function getBgTrackColor(pct: number): string {
  if (pct >= 80) return "#d1fae5";
  if (pct >= 40) return "#fef3c7";
  return "#fecdd3";
}

export function ProgressGauge({
  persentase,
  size = 140,
  label,
  strokeWidth = 10,
}: ProgressGaugeProps) {
  const safePct = Math.max(0, Math.min(100, persentase));
  const color = getTrackColor(safePct);
  const bgColor = getBgTrackColor(safePct);

  const data = [
    {
      name: "progress",
      value: safePct,
      fill: color,
    },
  ];

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: bgColor, opacity: 0.4 }}
      />
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="75%"
          outerRadius="95%"
          barSize={strokeWidth}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            background={{ fill: bgColor }}
            dataKey="value"
            cornerRadius={10}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-extrabold tracking-tight leading-none",
            size >= 120 ? "text-3xl" : size >= 90 ? "text-2xl" : "text-xl"
          )}
          style={{ color }}
        >
          {safePct.toFixed(0)}%
        </span>
        {label && (
          <span className="text-[10px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
