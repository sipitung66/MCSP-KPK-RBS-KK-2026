"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { AreaProgress } from "@/lib/calculations";

interface AreaBarChartProps {
  data: AreaProgress[];
}

function getBarColor(persentase: number): string {
  if (persentase >= 80) return "#10b981";
  if (persentase >= 40) return "#f59e0b";
  return "#f43f5e";
}

function truncateText(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "..." : text;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: AreaProgress;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const color = getBarColor(d.persentase);
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-xl p-4 min-w-[240px]">
        <p className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-2">
          {d.areaName}
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Dokumen Terpenuhi</span>
            <span className="font-bold text-slate-800">
              {d.terpenuhi} / {d.target}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Persentase</span>
            <span
              className="font-bold text-sm"
              style={{ color }}
            >
              {d.persentase.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100 mt-2">
            <span className="text-slate-500">Kurang</span>
            <span className="font-bold text-rose-600">
              {Math.max(d.target - d.terpenuhi, 0)} dokumen
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function AreaBarChart({ data }: AreaBarChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    shortName: truncateText(d.areaName, 22),
  }));

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800">
          Progres Pemenuhan Dokumen Per Area Strategis MCSP
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          7 Area Strategis — Persentase Pemenuhan Dokumen
        </p>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#cbd5e1" }}
              tickLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              width={160}
              tick={{ fontSize: 11, fill: "#475569" }}
              axisLine={{ stroke: "#cbd5e1" }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="rect"
              wrapperStyle={{ fontSize: 12 }}
            />
            <ReferenceLine
              x={80}
              stroke="#10b981"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "Optimal (80%)",
                position: "top",
                fill: "#10b981",
                fontSize: 10,
                fontWeight: 700,
              }}
            />
            <ReferenceLine
              x={40}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "Minimum (40%)",
                position: "bottom",
                fill: "#f59e0b",
                fontSize: 10,
                fontWeight: 700,
              }}
            />
            <Bar
              dataKey="persentase"
              name="Persentase (%)"
              radius={[0, 6, 6, 0]}
              barSize={22}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.persentase)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
