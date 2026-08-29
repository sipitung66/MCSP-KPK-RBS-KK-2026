"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Save, ShieldCheck } from "lucide-react";
import { saveRiskAssessment } from "@/lib/actions/risk.actions";
import { calculateIndicatorScore } from "@/lib/scoring";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MCSP_AREA_OPTIONS } from "@/lib/mcsp-rbs";
import type { MCSPArea, MCSPIndicator, OPDList, RiskAssessment, RiskLevel } from "@prisma/client";

interface Props {
  areas: MCSPArea[];
  opds: OPDList[];
  indicators: MCSPIndicator[];
  initialAssessments: RiskAssessment[];
}

const riskLabels: Record<RiskLevel, string> = { RENDAH: "Rendah", SEDANG: "Sedang", TINGGI: "Tinggi" };

export function RiskContent({ areas, opds, indicators, initialAssessments }: Props) {
  const fallbackAreas = MCSP_AREA_OPTIONS.map((area) => ({
    id: area.id,
    areaName: area.areaName,
    targetDocs: 0,
    description: null,
    createdAt: new Date(),
  } as MCSPArea));
  const areaOptions = areas.length > 0 ? areas : fallbackAreas;
  const [assessments, setAssessments] = useState(initialAssessments);
  const [opdName, setOpdName] = useState(opds[0]?.opdName ?? "");
  const [areaId, setAreaId] = useState(String(areaOptions[0]?.id ?? 1));
  const [indicatorId, setIndicatorId] = useState("");
  const [completenessScore, setCompletenessScore] = useState("");
  const [completedEvidence, setCompletedEvidence] = useState("0");
  const [totalEvidence, setTotalEvidence] = useState("0");
  const [riskScore, setRiskScore] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("SEDANG");
  const [analysis, setAnalysis] = useState("");
  const [redFlags, setRedFlags] = useState("");
  const [controlWeakness, setControlWeakness] = useState("");
  const [impact, setImpact] = useState("");
  const [mitigation, setMitigation] = useState("");
  const [saving, setSaving] = useState(false);

  const areaIndicators = useMemo(() => indicators.filter((indicator) => indicator.areaId === Number(areaId)), [areaId, indicators]);
  const selectedIndicator = indicators.find((indicator) => indicator.id === indicatorId);
  const calculatedScore = selectedIndicator ? calculateIndicatorScore(selectedIndicator.scoringMethod, {
    completedDocuments: Number(completedEvidence),
    totalDocuments: Number(totalEvidence),
    binarySatisfied: Number(completedEvidence) > 0,
  }) : null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!indicatorId) {
      toast({ title: "Indikator wajib dipilih", variant: "destructive" });
      return;
    }
    setSaving(true);
    const result = await saveRiskAssessment({
      opdName, areaId: Number(areaId), indicatorId,
      completenessScore: calculatedScore?.score ?? (completenessScore ? Number(completenessScore) : undefined),
      riskScore: riskScore ? Number(riskScore) : undefined,
      riskLevel, analysis, redFlags: redFlags.split("\n"), controlWeakness, impact, mitigation,
    });
    setSaving(false);
    if (!result.success || !result.assessment) {
      toast({ title: "Asesmen gagal disimpan", description: result.error, variant: "destructive" });
      return;
    }
    setAssessments((current) => [result.assessment!, ...current.filter((item) => item.id !== result.assessment!.id)]);
    toast({ title: "Asesmen risiko tersimpan", description: "Status QA dikembalikan menjadi belum review." });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-teal-700" /> Form Asesmen Risiko</CardTitle>
            <CardDescription>Isi berdasarkan substansi eviden, bukan hanya keberadaan file.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="risk-opd">OPD</Label><select id="risk-opd" value={opdName} onChange={(event) => setOpdName(event.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">{opds.map((opd) => <option key={opd.opdName}>{opd.opdName}</option>)}</select></div>
                <div><Label htmlFor="risk-area">Area</Label><select id="risk-area" value={areaId} onChange={(event) => { setAreaId(event.target.value); setIndicatorId(""); }} className="mt-1 flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">{areaOptions.map((area) => <option key={area.id} value={area.id}>{area.id}. {area.areaName}</option>)}</select></div>
              </div>
              <div><Label htmlFor="risk-indicator">Indikator</Label><select id="risk-indicator" value={indicatorId} onChange={(event) => { const nextId = event.target.value; setIndicatorId(nextId); const nextIndicator = indicators.find((indicator) => indicator.id === nextId); setTotalEvidence(String(nextIndicator?.documentCount ?? 0)); }} className="mt-1 flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">Pilih indikator</option>{areaIndicators.map((indicator) => <option key={indicator.id} value={indicator.id}>{indicator.indicatorNo}. {indicator.indicatorName}</option>)}</select>{selectedIndicator && <p className="mt-1 text-xs text-slate-500">Metode kelengkapan: {selectedIndicator.scoringMethod} | Bobot dokumen: {selectedIndicator.documentCount}</p>}</div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><Label htmlFor="completed-evidence">Eviden valid</Label><Input id="completed-evidence" type="number" min="0" value={completedEvidence} onChange={(event) => setCompletedEvidence(event.target.value)} /></div>
                <div><Label htmlFor="total-evidence">Total eviden</Label><Input id="total-evidence" type="number" min="0" value={totalEvidence} onChange={(event) => setTotalEvidence(event.target.value)} /></div>
                <div><Label htmlFor="risk-score">Skor risiko</Label><Input id="risk-score" type="number" min="0" max="100" value={riskScore} onChange={(event) => setRiskScore(event.target.value)} /></div>
                <div><Label htmlFor="risk-level">Level risiko</Label><select id="risk-level" value={riskLevel} onChange={(event) => setRiskLevel(event.target.value as RiskLevel)} className="mt-1 flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">{(Object.keys(riskLabels) as RiskLevel[]).map((level) => <option key={level} value={level}>{riskLabels[level]}</option>)}</select></div>
              </div>
              <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900">Skor kelengkapan resmi: <strong>{calculatedScore?.score ?? (completenessScore || "-")}</strong> · {calculatedScore?.formula ?? "Pilih indikator untuk melihat formula."}</div>
              <div><Label htmlFor="analysis">Analisis substansi</Label><Textarea id="analysis" value={analysis} onChange={(event) => setAnalysis(event.target.value)} placeholder="Jelaskan pola, kewajaran, dan kesimpulan berbasis eviden." /></div>
              <div><Label htmlFor="red-flags">Red flags</Label><Textarea id="red-flags" value={redFlags} onChange={(event) => setRedFlags(event.target.value)} placeholder="Satu red flag per baris" /></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="weakness">Kelemahan pengendalian</Label><Textarea id="weakness" value={controlWeakness} onChange={(event) => setControlWeakness(event.target.value)} /></div><div><Label htmlFor="impact">Dampak potensial</Label><Textarea id="impact" value={impact} onChange={(event) => setImpact(event.target.value)} /></div></div>
              <div><Label htmlFor="mitigation">Mitigasi / rekomendasi</Label><Textarea id="mitigation" value={mitigation} onChange={(event) => setMitigation(event.target.value)} /></div>
              <Button type="submit" disabled={saving || !opdName || !indicatorId}><Save className="mr-2 h-4 w-4" />{saving ? "Menyimpan..." : "Simpan Asesmen"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader><CardTitle>Daftar Asesmen</CardTitle><CardDescription>{assessments.length} asesmen tersimpan</CardDescription></CardHeader>
          <CardContent className="space-y-3">{assessments.length === 0 ? <p className="text-sm text-slate-500">Belum ada asesmen risiko.</p> : assessments.map((assessment) => { const indicator = indicators.find((item) => item.id === assessment.indicatorId); return <div key={assessment.id} className="rounded-lg border border-slate-200 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-800">{assessment.opdName}</p><p className="mt-1 text-xs text-slate-500">Area {assessment.areaId} · {indicator?.indicatorName ?? assessment.indicatorId}</p></div><Badge variant={assessment.riskLevel === "TINGGI" ? "destructive" : "secondary"}>{assessment.riskLevel ? riskLabels[assessment.riskLevel] : "Belum dinilai"}</Badge></div><p className="mt-2 text-xs text-slate-500">Kelengkapan: {assessment.completenessScore ?? "-"} · Risiko: {assessment.riskScore ?? "-"} · QA: {assessment.qaStatus}</p>{assessment.redFlags.length > 0 && <p className="mt-2 flex gap-1 text-xs text-rose-700"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{assessment.redFlags.length} red flag</p>}</div>; })}</CardContent>
        </Card>
      </div>
    </div>
  );
}
