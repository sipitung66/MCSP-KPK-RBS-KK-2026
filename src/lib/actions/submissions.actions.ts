"use server";

import { prisma } from "@/lib/prisma";
import type { DocStatus, Submission } from "@prisma/client";

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
          note: status === "TERPENUHI" ? "Dokumen diunggah sesuai jadwal" : "Masih dalam proses penyusunan",
          submittedBy: status === "TERPENUHI" ? `admin.${opdName.split(" ")[0].toLowerCase()}@konawekab.go.id` : null,
          createdAt: now,
          updatedAt: now,
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
  note?: string
): Promise<UpsertSubmissionResult> {
  try {
    const submission = await prisma.submission.upsert({
      where: {
        opdName_areaId_documentName: {
          opdName,
          areaId,
          documentName,
        },
      },
      update: {
        status,
        fileUrl: fileUrl ?? undefined,
        note: note ?? undefined,
      },
      create: {
        opdName,
        areaId,
        documentName,
        status,
        fileUrl: fileUrl ?? null,
        note: note ?? null,
      },
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
      note: note ?? null,
      submittedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { success: true, submission: mockSubmission };
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
      return GLOBAL_MOCK_SUBMISSIONS.filter((s) => s.opdName === opdName);
    }
    return [...GLOBAL_MOCK_SUBMISSIONS];
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
    return GLOBAL_MOCK_SUBMISSIONS.filter((s) => s.areaId === areaId);
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
    return [...GLOBAL_MOCK_SUBMISSIONS];
  }
}
