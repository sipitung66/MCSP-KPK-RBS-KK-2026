export type ComplianceStatus = "Optimal" | "Dalam Proses" | "Belum Memadai";

export interface AreaProgress {
  areaId: number;
  areaName: string;
  terpenuhi: number;
  target: number;
  persentase: number;
}

export interface OPDProgress {
  opdName: string;
  terpenuhi: number;
  target: number;
  persentase: number;
  status: ComplianceStatus;
}

export interface GlobalSummary {
  totalTarget: number;
  totalTerpenuhi: number;
  persentase: number;
  ratioText: string;
  status: ComplianceStatus;
}

export interface EWSResult {
  opdTerendah: {
    opdName: string;
    persentase: number;
    status: ComplianceStatus;
    terpenuhi: number;
    target: number;
  }[];
  areaGapTerbesar: {
    areaId: number;
    areaName: string;
    gap: number;
    terpenuhi: number;
    target: number;
    persentase: number;
  }[];
}

interface BaseSubmission {
  opdName: string;
  areaId: number;
  status: "TERPENUHI" | "BELUM_TERPENUHI";
}

interface BaseMCSPArea {
  id: number;
  areaName: string;
  targetDocs: number;
}

export function hitungPersentase(terpenuhi: number, target: number): number {
  if (target <= 0) return 0;
  if (terpenuhi <= 0) return 0;
  const pct = (terpenuhi / target) * 100;
  if (pct > 100) return 100;
  return Math.round(pct * 100) / 100;
}

export function getStatusKepatuhan(persentase: number): ComplianceStatus {
  if (persentase >= 80) return "Optimal";
  if (persentase >= 40) return "Dalam Proses";
  return "Belum Memadai";
}

export function hitungRasioTeks(terpenuhi: number, target: number): string {
  return `${terpenuhi} / ${target}`;
}

export function hitungProgresPerArea(
  submissions: BaseSubmission[],
  areas: BaseMCSPArea[]
): AreaProgress[] {
  const terpenuhiPerArea = new Map<number, number>();

  for (const s of submissions) {
    if (s.status === "TERPENUHI") {
      const current = terpenuhiPerArea.get(s.areaId) ?? 0;
      terpenuhiPerArea.set(s.areaId, current + 1);
    }
  }

  return areas.map((area) => {
    const terpenuhi = terpenuhiPerArea.get(area.id) ?? 0;
    const persentase = hitungPersentase(terpenuhi, area.targetDocs);
    return {
      areaId: area.id,
      areaName: area.areaName,
      terpenuhi,
      target: area.targetDocs,
      persentase,
    };
  });
}

export function hitungRasioOPD(
  submissions: BaseSubmission[],
  areas: BaseMCSPArea[]
): OPDProgress[] {
  const opdMap = new Map<
    string,
    { terpenuhi: number; totalPerArea: Map<number, number> }
  >();

  const totalTargetPerOPD = areas.reduce((sum, a) => sum + a.targetDocs, 0);

  for (const s of submissions) {
    let opdData = opdMap.get(s.opdName);
    if (!opdData) {
      opdData = { terpenuhi: 0, totalPerArea: new Map<number, number>() };
      opdMap.set(s.opdName, opdData);
    }
    if (s.status === "TERPENUHI") {
      opdData.terpenuhi += 1;
    }
  }

  const result: OPDProgress[] = [];
  for (const [opdName, data] of opdMap.entries()) {
    const persentase = hitungPersentase(data.terpenuhi, totalTargetPerOPD);
    result.push({
      opdName,
      terpenuhi: data.terpenuhi,
      target: totalTargetPerOPD,
      persentase,
      status: getStatusKepatuhan(persentase),
    });
  }

  result.sort((a, b) => a.opdName.localeCompare(b.opdName));
  return result;
}

export function hitungKumulatifGlobal(
  submissions: BaseSubmission[],
  areas: BaseMCSPArea[],
  opdCount: number
): GlobalSummary {
  const totalTarget =
    areas.reduce((sum, a) => sum + a.targetDocs, 0) * Math.max(opdCount, 1);
  const totalTerpenuhi = submissions.filter(
    (s) => s.status === "TERPENUHI"
  ).length;
  const persentase = hitungPersentase(totalTerpenuhi, totalTarget);

  return {
    totalTarget,
    totalTerpenuhi,
    persentase,
    ratioText: hitungRasioTeks(totalTerpenuhi, totalTarget),
    status: getStatusKepatuhan(persentase),
  };
}

export function generateEWS(
  opdProgress: OPDProgress[],
  areaProgress: AreaProgress[]
): EWSResult {
  const opdTerendah = opdProgress
    .filter((opd) => opd.persentase < 60)
    .map((opd) => ({
      opdName: opd.opdName,
      persentase: opd.persentase,
      status: opd.status,
      terpenuhi: opd.terpenuhi,
      target: opd.target,
    }))
    .sort((a, b) => a.persentase - b.persentase);

  const areaGapTerbesar = areaProgress
    .map((area) => ({
      areaId: area.areaId,
      areaName: area.areaName,
      gap: Math.max(area.target - area.terpenuhi, 0),
      terpenuhi: area.terpenuhi,
      target: area.target,
      persentase: area.persentase,
    }))
    .sort((a, b) => b.gap - a.gap);

  return { opdTerendah, areaGapTerbesar };
}
