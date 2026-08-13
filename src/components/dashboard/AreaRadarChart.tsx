"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AreaProgress } from "@/lib/calculations";

interface AreaRadarChartProps {
  progresPerArea: AreaProgress[];
  title?: string;
  height?: number;
}

export function AreaRadarChart({ progresPerArea, title = "Radar Pemenuhan 7 Area Strategis", height = 420 }: AreaRadarChartProps) {
  const chartData = progresPerArea.map((a) => ({
    area: a.areaName.length > 16 ? a.areaName.slice(0, 16) + "..." : a.areaName,
    fullName: a.areaName,
    Persentase: a.persentase,
    Terpenuhi: a.terpenuhi,
    Target: a.target,
  }));

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} outerRadius="75%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="area" tick={{ fontSize: 10.5, fill: "#475569" }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Radar
                name="Persentase (%)"
                dataKey="Persentase"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "Persentase (%)") return [`${value}%`, name as any];
                  return [value as any, name as any];
                }}
                labelFormatter={(label, payload) => {
                  const p = (payload as any)?.[0]?.payload as { fullName?: string } | undefined;
                  return p?.fullName ?? label;
                }}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
