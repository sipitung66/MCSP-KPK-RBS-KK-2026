"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { DocStatus, Submission, VerificationStatus } from "@prisma/client";

const ACTIVE_ASSESSMENT_YEAR = 2026;
const ACTIVE_PERIOD = "TAHUNAN";

function isGoogleEvidenceUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && [
      "drive.google.com",
      "docs.google.com",
      "sheets.google.com",
      "slides.google.com",
    ].includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

interface UpsertSubmissionResult {
  success: boolean;
  submission?: Submission;
  error?: string;
}

export async function upsertSubmission(
  opdName: string,
  areaId: number,
  documentName: string,
  status: DocStatus,
  fileUrl?: string,
  note?: string,
  workpaperUrl?: string,
  assessmentYear = ACTIVE_ASSESSMENT_YEAR,
  period = ACTIVE_PERIOD
): Promise<UpsertSubmissionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sesi login tidak ditemukan." };
  if (user.role === "ADMIN_OPD" && user.opdName !== opdName) {
    return { success: false, error: "OPD hanya dapat mengubah data miliknya sendiri." };
  }
  if (user.role !== "ADMIN_OPD" && user.role !== "ADMIN_UTAMA") {
    return { success: false, error: "Role user tidak diizinkan." };
  }

  let profile;
  try {
    const [opd, area] = await Promise.all([
      prisma.oPDList.findUnique({ where: { opdName }, select: { opdName: true } }),
      prisma.mCSPArea.findUnique({ where: { id: areaId }, select: { id: true } }),
    ]);
    if (!opd || !area) return { success: false, error: "OPD atau area tidak terdaftar." };
    profile = await prisma.oPDTagProfile.findUnique({
      where: { opdName_areaId_assessmentYear_period: { opdName, areaId, assessmentYear, period } },
      select: { requiredDocs: true, workpapers: true, hierarchy: true },
    });
  } catch {
    return { success: false, error: "Konfigurasi tagging belum dapat diverifikasi." };
  }
  if (profile) {
    const configuredNames = new Set([
      ...profile.requiredDocs,
      ...profile.workpapers,
      ...(((profile.hierarchy as { [key: string]: { objectives?: Array<{ indicators?: Array<{ documents?: Array<{ label?: string }>; workpapers?: Array<{ label?: string }> }> }> } } | null)?.[String(areaId)]?.objectives ?? [])
        .flatMap((objective) => objective.indicators ?? [])
        .flatMap((indicator) => [...(indicator.documents ?? []), ...(indicator.workpapers ?? [])])
        .map((option) => option.label ?? "")),
    ]);
    if (!configuredNames.has(documentName)) return { success: false, error: "Bukti ini belum ditagging oleh Admin Utama." };
  }

  if (status === "TERPENUHI" && !fileUrl && !workpaperUrl) {
    return { success: false, error: "Bukti terpenuhi harus memiliki file atau URL bukti." };
  }
  if ((fileUrl && !isGoogleEvidenceUrl(fileUrl)) || (workpaperUrl && !isGoogleEvidenceUrl(workpaperUrl))) {
    return { success: false, error: "URL eviden harus berasal dari Google Drive, Google Docs, Sheets, atau Slides." };
  }

  try {
    const existing = await prisma.submission.findUnique({
      where: { opdName_areaId_documentName_assessmentYear_period: { opdName, areaId, documentName, assessmentYear, period } },
    });
    const submission = await prisma.$transaction(async (transaction) => {
      const saved = await transaction.submission.upsert({
        where: { opdName_areaId_documentName_assessmentYear_period: { opdName, areaId, documentName, assessmentYear, period } },
        update: {
          status,
          fileUrl: status === "BELUM_TERPENUHI" ? null : fileUrl ?? undefined,
          workpaperUrl: status === "BELUM_TERPENUHI" ? null : workpaperUrl ?? undefined,
          note: note ?? undefined,
          submittedBy: user.userId,
          assessmentYear,
          period,
          verificationStatus: "BELUM_DIVERIFIKASI",
          verifiedBy: null,
          verifiedAt: null,
          verificationNote: null,
        },
        create: {
          opdName,
          areaId,
          documentName,
          status,
          fileUrl: fileUrl ?? null,
          workpaperUrl: workpaperUrl ?? null,
          note: note ?? null,
          submittedBy: user.userId,
          assessmentYear,
          period,
        },
      });
      await transaction.auditLog.create({
        data: {
          entityType: "Submission",
          entityId: saved.id,
          action: existing ? "UPDATE" : "CREATE",
          actorId: user.userId,
          beforeData: existing ? JSON.parse(JSON.stringify(existing)) : undefined,
          afterData: JSON.parse(JSON.stringify(saved)),
        },
      });
      return saved;
    });

    return { success: true, submission };
  } catch (dbError) {
    console.warn("[submissions.actions.ts] upsertSubmission DB error, using mock fallback:", dbError instanceof Error ? dbError.message : String(dbError));

    const mockSubmission: Submission = {
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      opdName,
      areaId,
      documentName,
      status,
      fileUrl: fileUrl ?? null,
      workpaperUrl: workpaperUrl ?? null,
      note: note ?? null,
      submittedBy: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      assessmentYear,
      period,
      verificationStatus: "BELUM_DIVERIFIKASI" as VerificationStatus,
      verifiedBy: null,
      verifiedAt: null,
      verificationNote: null,
    };

    return { success: false, error: "Data gagal disimpan karena database tidak tersedia." };
  }
}

export async function getSubmissionsByOPD(opdName?: string): Promise<Submission[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const scopedOPD = user.role === "ADMIN_OPD" ? user.opdName : opdName;
  if (user.role === "ADMIN_OPD" && (!user.opdName || (opdName && opdName !== user.opdName))) return [];
  try {
    const orderBy = [{ opdName: "asc" as const }, { areaId: "asc" as const }, { documentName: "asc" as const }];
    const submissions = scopedOPD
      ? await prisma.submission.findMany({ where: { opdName: scopedOPD }, orderBy })
      : await prisma.submission.findMany({ orderBy });
    return submissions;
  } catch (dbError) {
    console.warn("[submissions.actions.ts] getSubmissionsByOPD DB error, using mock:", dbError instanceof Error ? dbError.message : String(dbError));
    if (opdName) {
      return [];
    }
    return [];
  }
}

export async function getSubmissionsByArea(areaId: number): Promise<Submission[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  try {
    const submissions = await prisma.submission.findMany({
      where: { areaId, ...(user.role === "ADMIN_OPD" && user.opdName ? { opdName: user.opdName } : {}) },
      orderBy: [{ opdName: "asc" }, { documentName: "asc" }],
    });
    return submissions;
  } catch (dbError) {
    console.warn("[submissions.actions.ts] getSubmissionsByArea DB error, using mock:", dbError instanceof Error ? dbError.message : String(dbError));
    return [];
  }
}

export async function verifySubmission(
  submissionId: string,
  verificationStatus: VerificationStatus,
  verificationNote?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN_UTAMA") {
    return { success: false, error: "Hanya Admin Utama yang dapat memverifikasi bukti." };
  }
  if (!submissionId || verificationStatus === "BELUM_DIVERIFIKASI") {
    return { success: false, error: "Status verifikasi tidak valid." };
  }

  try {
    const existing = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!existing) return { success: false, error: "Submission tidak ditemukan." };
    if (verificationStatus === "DIVERIFIKASI" && (existing.status !== "TERPENUHI" || (!existing.fileUrl && !existing.workpaperUrl))) {
      return { success: false, error: "Bukti harus berstatus TERPENUHI dan memiliki eviden sebelum diverifikasi." };
    }
    const result = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.submission.update({
        where: { id: submissionId },
        data: {
          verificationStatus,
          verifiedBy: user.userId,
          verifiedAt: new Date(),
          verificationNote: verificationNote?.trim() || null,
        },
      });
      await transaction.auditLog.create({
        data: {
          entityType: "Submission",
          entityId: submissionId,
          action: "VERIFY",
          actorId: user.userId,
          beforeData: JSON.parse(JSON.stringify(existing)),
          afterData: JSON.parse(JSON.stringify(updated)),
          reason: verificationNote?.trim() || undefined,
        },
      });
      return updated;
    });
    void result;
    return { success: true };
  } catch (error) {
    console.error("[submissions.actions.ts] verifySubmission failed:", error);
    return { success: false, error: "Verifikasi gagal disimpan." };
  }
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN_UTAMA") return [];
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: [{ opdName: "asc" }, { areaId: "asc" }, { documentName: "asc" }],
    });
    return submissions;
  } catch (dbError) {
    console.warn("[submissions.actions.ts] getAllSubmissions DB error, using mock:", dbError instanceof Error ? dbError.message : String(dbError));
    return [];
  }
}
