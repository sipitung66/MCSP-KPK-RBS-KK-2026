"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AreaProgress } from "@/lib/calculations";

interface AreaBarChartProps {
  progresPerArea: AreaProgress[];
  title?: string;
  height?: number;
}

const getBarColor = (persentase: number): string => {
  if (persentase >= 80) return "#10b981";
  if (persentase >= 40) return "#f59e0b";
  return "#f43f5e";
};

export function AreaBarChart({ progresPerArea, title = "Pemenuhan Per Area Strategis", height = 360 }: AreaBarChartProps) {
  const chartData = progresPerArea.map((a) => ({
    name: a.areaName.length > 18 ? a.areaName.slice(0, 18) + "..." : a.areaName,
    fullName: a.areaName,
    Terpenuhi: a.terpenuhi,
    Target: a.target,
    Persentase: a.persentase,
  }));

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#64748b" }}
                angle={-30}
                textAnchor="end"
                height={70}
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                formatter={(value, name, props: any) => {
                  if (name === "Persentase") return [`${value}%`, "Persentase"];
                  return [value as any, name];
                }}
                labelFormatter={(label, payload) => {
                  const p = (payload as any)?.[0]?.payload as { fullName?: string } | undefined;
                  return p?.fullName ?? label;
                }}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={26}>
                {chartData.map((_, index) => (
                  <Cell key={`target-${index}`} fill="#cbd5e1" />
                ))}
              </Bar>
              <Bar dataKey="Terpenuhi" radius={[4, 4, 0, 0]} barSize={26}>
                {chartData.map((entry, index) => (
                  <Cell key={`terpenuhi-${index}`} fill={getBarColor(entry.Persentase)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
