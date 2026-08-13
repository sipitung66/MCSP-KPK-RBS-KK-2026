"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type OPDProgress } from "@/lib/calculations";
import { ComplianceBadge } from "@/components/dashboard/ComplianceBadge";

interface OPDBarChartProps {
  rasioOPD: OPDProgress[];
  title?: string;
  height?: number;
}

const getBarColor = (persentase: number): string => {
  if (persentase >= 80) return "#10b981";
  if (persentase >= 40) return "#f59e0b";
  return "#f43f5e";
};

const shortOPDName = (name: string): string => {
  const prefixes = ["Badan ", "Dinas ", "Inspektorat "];
  let short = name;
  for (const p of prefixes) {
    if (short.startsWith(p)) {
      short = short.replace(p, "");
      break;
    }
  }
  if (short.length > 22) {
    const words = short.split(" ");
    if (words.length > 3) {
      short = words.slice(0, 3).join(" ") + "...";
    } else {
      short = short.slice(0, 22) + "...";
    }
  }
  return short;
};

export function OPDBarChart({ rasioOPD, title = "Pemenuhan Per OPD", height = 420 }: OPDBarChartProps) {
  const chartData = rasioOPD.map((opd) => ({
    name: shortOPDName(opd.opdName),
    fullName: opd.opdName,
    Terpenuhi: opd.terpenuhi,
    Target: opd.target,
    Persentase: opd.persentase,
    Status: opd.status,
  }));

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <CardTitle className="text-base font-bold text-slate-800">{title}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <ComplianceBadge persentase={85} showPercentage={false} size="sm" />
          <span className="text-xs text-slate-500 self-center">≥ 80%</span>
          <ComplianceBadge persentase={50} showPercentage={false} size="sm" />
          <span className="text-xs text-slate-500 self-center">40-80%</span>
          <ComplianceBadge persentase={20} showPercentage={false} size="sm" />
          <span className="text-xs text-slate-500 self-center">{'<'} 40%</span>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 40, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 10.5, fill: "#64748b" }}
                width={170}
                interval={0}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "Persentase") return [`${value}%`, "Persentase" as any];
                  return [value as any, name as any];
                }}
                labelFormatter={(label, payload) => {
                  const p = (payload as any)?.[0]?.payload as { fullName?: string } | undefined;
                  return p?.fullName ?? label;
                }}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Target" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={18}>
                {chartData.map((_, index) => (
                  <Cell key={`target-${index}`} fill="#cbd5e1" />
                ))}
              </Bar>
              <Bar dataKey="Terpenuhi" radius={[0, 4, 4, 0]} barSize={18}>
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
