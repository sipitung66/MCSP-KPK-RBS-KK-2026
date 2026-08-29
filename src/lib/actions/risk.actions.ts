"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { RiskAssessment, RiskLevel } from "@prisma/client";

export interface RiskInput {
  opdName: string;
  areaId: number;
  indicatorId: string;
  assessmentYear?: number;
  period?: string;
  completenessScore?: number;
  riskScore?: number;
  riskLevel?: RiskLevel;
  analysis?: string;
  redFlags?: string[];
  controlWeakness?: string;
  impact?: string;
  mitigation?: string;
}

function validScore(value: number | undefined): boolean {
  return value === undefined || (Number.isFinite(value) && value >= 0 && value <= 100);
}

export async function saveRiskAssessment(input: RiskInput): Promise<{ success: boolean; assessment?: RiskAssessment; error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN_UTAMA") return { success: false, error: "Hanya Admin Utama yang dapat menilai risiko." };
  if (!input.opdName.trim() || !Number.isInteger(input.areaId) || !input.indicatorId.trim()) return { success: false, error: "OPD, area, dan indikator wajib diisi." };
  if (!validScore(input.completenessScore) || !validScore(input.riskScore)) return { success: false, error: "Skor harus berada di antara 0 dan 100." };

  const assessmentYear = input.assessmentYear ?? 2026;
  const period = input.period?.trim() || "TAHUNAN";
  const opdName = input.opdName.trim();
  const indicatorId = input.indicatorId.trim();
  const redFlags = Array.from(new Set((input.redFlags ?? []).map((value) => value.trim()).filter(Boolean)));

  try {
    const existing = await prisma.riskAssessment.findUnique({ where: { opdName_indicatorId_assessmentYear_period: { opdName, indicatorId, assessmentYear, period } } });
    const assessment = await prisma.$transaction(async (transaction) => {
      const saved = await transaction.riskAssessment.upsert({
        where: { opdName_indicatorId_assessmentYear_period: { opdName, indicatorId, assessmentYear, period } },
        create: {
          opdName, areaId: input.areaId, indicatorId, assessmentYear, period,
          completenessScore: input.completenessScore, riskScore: input.riskScore, riskLevel: input.riskLevel,
          analysis: input.analysis?.trim() || null, redFlags, controlWeakness: input.controlWeakness?.trim() || null,
          impact: input.impact?.trim() || null, mitigation: input.mitigation?.trim() || null,
          assessedBy: user.userId, assessedAt: new Date(), qaStatus: "BELUM_REVIEW",
        },
        update: {
          areaId: input.areaId, completenessScore: input.completenessScore, riskScore: input.riskScore, riskLevel: input.riskLevel,
          analysis: input.analysis?.trim() || null, redFlags, controlWeakness: input.controlWeakness?.trim() || null,
          impact: input.impact?.trim() || null, mitigation: input.mitigation?.trim() || null,
          assessedBy: user.userId, assessedAt: new Date(), qaStatus: "BELUM_REVIEW", qaBy: null, qaAt: null,
        },
      });
      await transaction.auditLog.create({
        data: { entityType: "RiskAssessment", entityId: saved.id, action: existing ? "UPDATE" : "CREATE", actorId: user.userId, beforeData: existing ? JSON.parse(JSON.stringify(existing)) : undefined, afterData: JSON.parse(JSON.stringify(saved)) },
      });
      return saved;
    });
    return { success: true, assessment };
  } catch (error) {
    console.error("[risk.actions.ts] saveRiskAssessment failed:", error);
    return { success: false, error: "Asesmen risiko gagal disimpan." };
  }
}

export async function getRiskAssessments(opdName?: string): Promise<RiskAssessment[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const scopedOPD = user.role === "ADMIN_OPD" ? user.opdName : opdName;
  if (user.role === "ADMIN_OPD" && (!user.opdName || (opdName && opdName !== user.opdName))) return [];
  return prisma.riskAssessment.findMany({ where: scopedOPD ? { opdName: scopedOPD } : undefined, orderBy: [{ areaId: "asc" }, { opdName: "asc" }] });
}
