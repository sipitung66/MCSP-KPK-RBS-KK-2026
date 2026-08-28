"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { DocStatus, Submission, VerificationStatus } from "@prisma/client";

const ACTIVE_ASSESSMENT_YEAR = 2026;
const ACTIVE_PERIOD = "TAHUNAN";

interface UpsertSubmissionResult {
  success: boolean;
  submission?: Submission;
  error?: string;
}

const MOCK_OPD_NAMES: string[] = [
  "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia",
  "Badan Pengelolaan Keuangan dan Aset Daerah",
  "Dinas Pekerjaan Umum dan Perumahan Rakyat",
  "Dinas Pendidikan dan Kebudayaan",
  "Dinas Kesehatan",
  "Dinas Sosial",
  "Dinas Perhubungan",
  "Dinas Lingkungan Hidup",
  "Dinas Pertanian dan Ketahanan Pangan",
  "Dinas Perindustrian dan Perdagangan",
  "Dinas Komunikasi dan Informatika",
  "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu",
  "Dinas Pariwisata",
  "Dinas Pertanahan dan Tata Ruang",
  "Inspektorat Daerah",
];

const MOCK_DOCUMENTS_PER_AREA: Record<number, string[]> = {
  1: [
    "Dokumen Perencanaan Strategis (Renstra)",
    "Dokumen Rencana Kinerja Tahunan (RKT)",
    "Dokumen Rencana Aksi Pencegahan Korupsi (RAKK)",
    "Laporan Kinerja Tahunan",
    "Dokumen Analisis Jabatan",
  ],
  2: [
    "SOP Pengelolaan Keuangan",
    "Laporan Realisasi Anggaran",
    "Dokumen Pertanggungjawaban Keuangan",
  ],
  3: [
    "Dokumen Perencanaan Pengadaan",
    "SOP Pengadaan Barang/Jasa",
    "Laporan Pelaksanaan Pengadaan",
    "Dokumen Kontrak Pengadaan",
    "Laporan Hasil Pemeriksaan Pengadaan",
  ],
  4: [
    "SOP Manajemen Kepegawaian",
    "Dokumen Mutasi Jabatan",
    "Laporan Penilaian Kinerja Pegawai",
    "Dokumen Penerimaan Pegawai",
  ],
  5: [
    "SOP Pelayanan Publik",
    "Standar Pelayanan Minimal (SPM)",
    "Laporan Kepuasan Masyarakat",
    "Dokumen Maklumat Pelayanan",
    "SOP Pengaduan Masyarakat",
    "Buku Regulasi Pelayanan",
    "Dokumen Inovasi Pelayanan",
  ],
  6: [
    "SOP Pengelolaan Aset",
    "Dokumen Inventarisasi Aset",
    "Laporan Pemanfaatan Aset",
  ],
  7: [
    "Laporan Kinerja Pengawasan",
    "Dokumen Tindak Lanjut Hasil Pengawasan",
  ],
};

function generateMockSubmissions(): Submission[] {
  const mockData: Submission[] = [];
  const now = new Date();

  for (const opdName of MOCK_OPD_NAMES) {
    for (let areaId = 1; areaId <= 7; areaId++) {
      const docs = MOCK_DOCUMENTS_PER_AREA[areaId] || [];
      for (const docName of docs) {
        const randomVal = Math.random();
        const status: DocStatus = randomVal > 0.35 ? "TERPENUHI" : "BELUM_TERPENUHI";
        mockData.push({
          id: `mock-${opdName}-${areaId}-${docName}`.replace(/\s+/g, "-").toLowerCase(),
          opdName,
          areaId,
          documentName: docName,
          status,
          fileUrl: status === "TERPENUHI" ? `https://storage.example.com/files/${opdName}/${areaId}/${docName}.pdf` : null,
          workpaperUrl: status === "TERPENUHI" ? `https://storage.example.com/workpapers/${opdName}/${areaId}/${docName}.pdf` : null,
          note: status === "TERPENUHI" ? "Dokumen diunggah sesuai jadwal" : "Masih dalam proses penyusunan",
          submittedBy: status === "TERPENUHI" ? `admin.${opdName.split(" ")[0].toLowerCase()}@konawekab.go.id` : null,
          createdAt: now,
          updatedAt: now,
          assessmentYear: ACTIVE_ASSESSMENT_YEAR,
          period: ACTIVE_PERIOD,
          verificationStatus: "BELUM_DIVERIFIKASI",
          verifiedBy: null,
          verifiedAt: null,
          verificationNote: null,
        });
      }
    }
  }

  return mockData;
}

const GLOBAL_MOCK_SUBMISSIONS = generateMockSubmissions();

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

  try {
    const existing = await prisma.submission.findUnique({
      where: { opdName_areaId_documentName_assessmentYear_period: { opdName, areaId, documentName, assessmentYear, period } },
    });
    const submission = await prisma.$transaction(async (transaction) => {
      const saved = await transaction.submission.upsert({
        where: { opdName_areaId_documentName_assessmentYear_period: { opdName, areaId, documentName, assessmentYear, period } },
        update: {
          status,
          fileUrl: fileUrl ?? undefined,
          workpaperUrl: workpaperUrl ?? undefined,
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
  try {
    const orderBy = [{ opdName: "asc" as const }, { areaId: "asc" as const }, { documentName: "asc" as const }];
    const submissions = opdName
      ? await prisma.submission.findMany({ where: { opdName }, orderBy })
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
  try {
    const submissions = await prisma.submission.findMany({
      where: { areaId },
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
    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        verificationStatus,
        verifiedBy: user.userId,
        verifiedAt: new Date(),
        verificationNote: verificationNote?.trim() || null,
      },
    });
    await prisma.auditLog.create({
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
    return { success: true };
  } catch (error) {
    console.error("[submissions.actions.ts] verifySubmission failed:", error);
    return { success: false, error: "Verifikasi gagal disimpan." };
  }
}

export async function getAllSubmissions(): Promise<Submission[]> {
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
