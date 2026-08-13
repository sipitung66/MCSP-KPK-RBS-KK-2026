"use server";

import { prisma } from "@/lib/prisma";
import {
  hitungKumulatifGlobal,
  hitungProgresPerArea,
  hitungRasioOPD,
  generateEWS,
  getStatusKepatuhan,
  hitungPersentase,
  hitungRasioTeks,
} from "@/lib/calculations";
import type {
  GlobalSummary,
  AreaProgress,
  OPDProgress,
  EWSResult,
  ComplianceStatus,
} from "@/lib/calculations";
import type { OPDList, MCSPArea } from "@prisma/client";

export interface DashboardSummary {
  globalSummary: GlobalSummary;
  progresPerArea: AreaProgress[];
  rasioOPD: OPDProgress[];
  ews: EWSResult;
  totalOPD: number;
  totalArea: number;
  opdList: OPDList[];
  areaList: MCSPArea[];
}

export interface OPDSpecificSummary {
  opdName: string;
  globalSummary: GlobalSummary;
  progresPerArea: AreaProgress[];
  statusKepatuhan: ComplianceStatus;
  rasioTeks: string;
  totalTerpenuhi: number;
  totalTarget: number;
  persentase: number;
}

const MOCK_AREAS: MCSPArea[] = [
  { id: 1, areaName: "Perencanaan Strategis", targetDocs: 25, description: "Area strategis perencanaan", createdAt: new Date() },
  { id: 2, areaName: "Pengelolaan Keuangan", targetDocs: 6, description: "Area pengelolaan keuangan daerah", createdAt: new Date() },
  { id: 3, areaName: "Pengadaan Barang/Jasa", targetDocs: 30, description: "Area pengadaan barang dan jasa pemerintah", createdAt: new Date() },
  { id: 4, areaName: "Manajemen Sumber Daya Manusia", targetDocs: 20, description: "Area kepegawaian dan SDM aparatur", createdAt: new Date() },
  { id: 5, areaName: "Pelayanan Publik", targetDocs: 35, description: "Area pelayanan publik kepada masyarakat", createdAt: new Date() },
  { id: 6, areaName: "Pengelolaan Aset Daerah", targetDocs: 16, description: "Area pengelolaan aset milik daerah", createdAt: new Date() },
  { id: 7, areaName: "Pengawasan Internal", targetDocs: 6, description: "Area pengawasan internal pemerintahan", createdAt: new Date() },
];

const MOCK_OPD_LIST: OPDList[] = [
  { id: 1, opdName: "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia", createdAt: new Date() },
  { id: 2, opdName: "Badan Pengelolaan Keuangan dan Aset Daerah", createdAt: new Date() },
  { id: 3, opdName: "Dinas Pekerjaan Umum dan Perumahan Rakyat", createdAt: new Date() },
  { id: 4, opdName: "Dinas Pendidikan dan Kebudayaan", createdAt: new Date() },
  { id: 5, opdName: "Dinas Kesehatan", createdAt: new Date() },
  { id: 6, opdName: "Dinas Sosial", createdAt: new Date() },
  { id: 7, opdName: "Dinas Perhubungan", createdAt: new Date() },
  { id: 8, opdName: "Dinas Lingkungan Hidup", createdAt: new Date() },
  { id: 9, opdName: "Dinas Pertanian dan Ketahanan Pangan", createdAt: new Date() },
  { id: 10, opdName: "Dinas Perindustrian dan Perdagangan", createdAt: new Date() },
  { id: 11, opdName: "Dinas Komunikasi dan Informatika", createdAt: new Date() },
  { id: 12, opdName: "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu", createdAt: new Date() },
  { id: 13, opdName: "Dinas Pariwisata", createdAt: new Date() },
  { id: 14, opdName: "Dinas Pertanahan dan Tata Ruang", createdAt: new Date() },
  { id: 15, opdName: "Inspektorat Daerah", createdAt: new Date() },
];

interface BaseSubmissionLite {
  opdName: string;
  areaId: number;
  status: "TERPENUHI" | "BELUM_TERPENUHI";
}

function generateMockSubmissionsLite(): BaseSubmissionLite[] {
  const result: BaseSubmissionLite[] = [];
  const docCounts: Record<number, number> = { 1: 5, 2: 3, 3: 5, 4: 4, 5: 7, 6: 3, 7: 2 };

  for (const opd of MOCK_OPD_LIST) {
    for (let areaId = 1; areaId <= 7; areaId++) {
      const count = docCounts[areaId] || 3;
      for (let i = 0; i < count; i++) {
        const threshold = 0.3 + (Math.random() * 0.45);
        result.push({
          opdName: opd.opdName,
          areaId,
          status: Math.random() > threshold ? "TERPENUHI" : "BELUM_TERPENUHI",
        });
      }
    }
  }

  return result;
}

const GLOBAL_MOCK_SUBMISSIONS_LITE = generateMockSubmissionsLite();

function generateMockDashboardSummary(): DashboardSummary {
  const opdList = MOCK_OPD_LIST;
  const areaList = MOCK_AREAS;
  const submissions = GLOBAL_MOCK_SUBMISSIONS_LITE;
  const opdCount = opdList.length;

  const globalSummary = hitungKumulatifGlobal(submissions, areaList, opdCount);
  const progresPerArea = hitungProgresPerArea(submissions, areaList);
  const rasioOPD = hitungRasioOPD(submissions, areaList);
  const ews = generateEWS(rasioOPD, progresPerArea);

  return {
    globalSummary,
    progresPerArea,
    rasioOPD,
    ews,
    totalOPD: opdCount,
    totalArea: areaList.length,
    opdList,
    areaList,
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const [submissions, areaList, opdList] = await Promise.all([
      prisma.submission.findMany({
        select: {
          opdName: true,
          areaId: true,
          status: true,
        },
      }),
      prisma.mCSPArea.findMany(),
      prisma.oPDList.findMany(),
    ]);

    const opdCount = opdList.length;
    const globalSummary = hitungKumulatifGlobal(submissions, areaList, opdCount);
    const progresPerArea = hitungProgresPerArea(submissions, areaList);
    const rasioOPD = hitungRasioOPD(submissions, areaList);
    const ews = generateEWS(rasioOPD, progresPerArea);

    return {
      globalSummary,
      progresPerArea,
      rasioOPD,
      ews,
      totalOPD: opdCount,
      totalArea: areaList.length,
      opdList,
      areaList,
    };
  } catch (dbError) {
    console.warn("[dashboard.actions.ts] getDashboardSummary DB error, using mock:", dbError instanceof Error ? dbError.message : String(dbError));
    return generateMockDashboardSummary();
  }
}

export async function getDashboardSummaryForOPD(opdName: string): Promise<OPDSpecificSummary> {
  let areaList: MCSPArea[];
  let submissions: BaseSubmissionLite[];
  let fetchError = false;

  try {
    const [areasDb, subsDb] = await Promise.all([
      prisma.mCSPArea.findMany(),
      prisma.submission.findMany({
        where: { opdName },
        select: {
          opdName: true,
          areaId: true,
          status: true,
        },
      }),
    ]);
    areaList = areasDb;
    submissions = subsDb;
  } catch (dbError) {
    console.warn("[dashboard.actions.ts] getDashboardSummaryForOPD DB error, using mock:", dbError instanceof Error ? dbError.message : String(dbError));
    fetchError = true;
    areaList = MOCK_AREAS;
    submissions = GLOBAL_MOCK_SUBMISSIONS_LITE.filter((s) => s.opdName === opdName);
  }

  if (fetchError && submissions.length === 0) {
    const docCounts: Record<number, number> = { 1: 5, 2: 3, 3: 5, 4: 4, 5: 7, 6: 3, 7: 2 };
    submissions = [];
    for (let areaId = 1; areaId <= 7; areaId++) {
      const count = docCounts[areaId] || 3;
      for (let i = 0; i < count; i++) {
        submissions.push({
          opdName,
          areaId,
          status: Math.random() > 0.35 ? "TERPENUHI" : "BELUM_TERPENUHI",
        });
      }
    }
  }

  const totalTarget = areaList.reduce((sum, a) => sum + a.targetDocs, 0);
  const totalTerpenuhi = submissions.filter((s) => s.status === "TERPENUHI").length;
  const persentase = hitungPersentase(totalTerpenuhi, totalTarget);
  const statusKepatuhan = getStatusKepatuhan(persentase);
  const rasioTeks = hitungRasioTeks(totalTerpenuhi, totalTarget);

  const singleOPDSubmissions = submissions;
  const progresPerArea = hitungProgresPerArea(singleOPDSubmissions, areaList);

  const globalSummary = hitungKumulatifGlobal(singleOPDSubmissions, areaList, 1);

  return {
    opdName,
    globalSummary,
    progresPerArea,
    statusKepatuhan,
    rasioTeks,
    totalTerpenuhi,
    totalTarget,
    persentase,
  };
}

export async function getAllOPDList(): Promise<OPDList[]> {
  try {
    const opds = await prisma.oPDList.findMany({ orderBy: { opdName: "asc" } });
    return opds;
  } catch (dbError) {
    console.warn("[dashboard.actions.ts] getAllOPDList DB error, using mock:", dbError instanceof Error ? dbError.message : String(dbError));
    return [...MOCK_OPD_LIST].sort((a, b) => a.opdName.localeCompare(b.opdName));
  }
}

export async function getAllAreas(): Promise<MCSPArea[]> {
  try {
    const areas = await prisma.mCSPArea.findMany({ orderBy: { id: "asc" } });
    return areas;
  } catch (dbError) {
    console.warn("[dashboard.actions.ts] getAllAreas DB error, using mock:", dbError instanceof Error ? dbError.message : String(dbError));
    return [...MOCK_AREAS].sort((a, b) => a.id - b.id);
  }
}
