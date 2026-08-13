"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { CheckCircle2, Clock4, AlertOctagon } from "lucide-react";
import type { OPDProgress, ComplianceStatus } from "@/lib/calculations";
import { getStatusKepatuhan } from "@/lib/calculations";

interface OPDBarChartProps {
  data: OPDProgress[];
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
    payload: OPDProgress & { shortName: string };
  }>;
}

const statusIconMap: Record<ComplianceStatus, typeof CheckCircle2> = {
  Optimal: CheckCircle2,
  "Dalam Proses": Clock4,
  "Belum Memadai": AlertOctagon,
};

const statusBadgeClass: Record<ComplianceStatus, string> = {
  Optimal: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Dalam Proses": "bg-amber-50 text-amber-700 border-amber-200",
  "Belum Memadai": "bg-rose-50 text-rose-700 border-rose-200",
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const status = getStatusKepatuhan(d.persentase);
    const StatusIcon = statusIconMap[status];
    const color = getBarColor(d.persentase);
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-xl p-4 min-w-[280px]">
        <p className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-2">
          {d.opdName}
        </p>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Rasio Dokumen</span>
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
          <div className="pt-2 border-t border-slate-100 mt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold"
              style={{
                backgroundColor: status === "Optimal" ? "#ecfdf5" : status === "Dalam Proses" ? "#fffbeb" : "#fff1f2",
                color: status === "Optimal" ? "#047857" : status === "Dalam Proses" ? "#b45309" : "#be123c",
                borderColor: status === "Optimal" ? "#a7f3d0" : status === "Dalam Proses" ? "#fde68a" : "#fecdd3",
              }}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {status}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function OPDBarChart({ data }: OPDBarChartProps) {
  const sorted = [...data].sort((a, b) => a.persentase - b.persentase);
  const chartData = sorted.map((d) => ({
    ...d,
    shortName: truncateText(d.opdName, 32),
  }));

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800">
          Komparasi Persentase Pemenuhan Per OPD
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {data.length} OPD — Diurutkan dari Persentase Terendah
        </p>
      </div>
      <div className="h-96 w-full">
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
              width={220}
              tick={{ fontSize: 10.5, fill: "#475569" }}
              axisLine={{ stroke: "#cbd5e1" }}
              tickLine={false}
              interval={0}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
            <ReferenceLine
              x={80}
              stroke="#10b981"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "80% Optimal",
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
                value: "40% Minimum",
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
              barSize={14}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`opd-cell-${index}`}
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
