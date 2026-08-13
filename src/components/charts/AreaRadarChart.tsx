"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { AreaProgress } from "@/lib/calculations";

interface AreaRadarChartProps {
  data: AreaProgress[];
}

function truncateText(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "..." : text;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      areaName: string;
      persentase: number;
      terpenuhi: number;
      target: number;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-xl p-4 min-w-[220px]">
        <p className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-2">
          {d.areaName}
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Terpenuhi</span>
            <span className="font-bold text-slate-800">
              {d.terpenuhi} / {d.target}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Kepatuhan</span>
            <span className="font-bold text-sm text-indigo-700">
              {d.persentase.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function AreaRadarChart({ data }: AreaRadarChartProps) {
  const radarData = data.map((d) => ({
    areaName: truncateText(d.areaName, 18),
    fullAreaName: d.areaName,
    persentase: d.persentase,
    terpenuhi: d.terpenuhi,
    target: d.target,
  }));

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800">
          Peta Radar Kepatuhan 7 Area MCSP
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Visualisasi Multivariat — Semua Area Strategis dalam Satu Pandangan
        </p>
      </div>
      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={radarData}
            outerRadius="80%"
            margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
          >
            <PolarGrid stroke="#e2e8f0" strokeWidth={1} />
            <PolarAngleAxis
              dataKey="areaName"
              tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickFormatter={(v) => `${v}%`}
              stroke="#cbd5e1"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: 12 }}
            />
            <defs>
              <linearGradient id="indigoGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <Radar
              name="Persentase Kepatuhan (%)"
              dataKey="persentase"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#indigoGradient)"
              fillOpacity={0.7}
              dot={{
                r: 4,
                fill: "#6366f1",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: "#4f46e5",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
