export type ComplianceStatus = "Optimal" | "Dalam Proses" | "Belum Memadai";

export interface AreaProgress {
  areaId: number;
  areaName: string;
  terpenuhi: number;
  target: number;
  persentase: number;
}

export interface WeightedRequirement {
  areaId: number;
  areaName: string;
  requiredDocs?: string[];
  workpapers?: string[];
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
  documentName?: string;
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

export function normalizeRequirementName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function calculateWeightedRequirementCompletion(
  submissions: BaseSubmission[],
  requirements: WeightedRequirement[]
): { target: number; completed: number; percent: number } {
  let weightedTarget = 0;
  let weightedCompleted = 0;

  for (const requirement of requirements) {
    const docs = requirement.requiredDocs ?? [];
    const workpapers = requirement.workpapers ?? [];

    const targetForArea = docs.length + workpapers.length * 0.5;
    weightedTarget += targetForArea;

    const completedDocs = docs.filter((docName) =>
      submissions.some(
        (submission) =>
          submission.areaId === requirement.areaId &&
          normalizeRequirementName(submission.documentName ?? "") === normalizeRequirementName(docName) &&
          submission.status === "TERPENUHI"
      )
    ).length;

    const completedWorkpapers = workpapers.filter((workpaperName) =>
      submissions.some(
        (submission) =>
          submission.areaId === requirement.areaId &&
          submission.status === "TERPENUHI" &&
          (
            normalizeRequirementName(submission.documentName ?? "") === normalizeRequirementName(workpaperName) ||
            normalizeRequirementName(submission.documentName ?? "").includes(normalizeRequirementName(workpaperName)) ||
            normalizeRequirementName(workpaperName).includes(normalizeRequirementName(submission.documentName ?? ""))
          )
      )
    ).length;

    weightedCompleted += completedDocs + completedWorkpapers * 0.5;
  }

  return {
    target: weightedTarget,
    completed: weightedCompleted,
    percent: hitungPersentase(weightedCompleted, weightedTarget),
  };
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
  areas: BaseMCSPArea[],
  requirementMap?: Record<number, WeightedRequirement>
): AreaProgress[] {
  const terpenuhiPerArea = new Map<number, number>();

  for (const s of submissions) {
    if (s.status === "TERPENUHI") {
      const current = terpenuhiPerArea.get(s.areaId) ?? 0;
      terpenuhiPerArea.set(s.areaId, current + 1);
    }
  }

  return areas.map((area) => {
    const requirement = requirementMap?.[area.id];
    const docs = requirement?.requiredDocs ?? [];
    const workpapers = requirement?.workpapers ?? [];
    const weightedTarget = docs.length + workpapers.length * 0.5;
    const areaSubmissionCount = submissions.filter((s) => s.areaId === area.id && s.status === "TERPENUHI").length;
    const target = requirement ? weightedTarget : area.targetDocs;

    let weightedCompleted = 0;
    if (requirement) {
      const completedDocs = docs.filter((docName) =>
        submissions.some(
          (submission) =>
            submission.areaId === area.id &&
            normalizeRequirementName(submission.documentName ?? "") === normalizeRequirementName(docName) &&
            submission.status === "TERPENUHI"
        )
      ).length;

      const completedWorkpapers = workpapers.filter((workpaperName) =>
        submissions.some(
          (submission) =>
            submission.areaId === area.id &&
            submission.status === "TERPENUHI" &&
            (
              normalizeRequirementName(submission.documentName ?? "") === normalizeRequirementName(workpaperName) ||
              normalizeRequirementName(submission.documentName ?? "").includes(normalizeRequirementName(workpaperName)) ||
              normalizeRequirementName(workpaperName).includes(normalizeRequirementName(submission.documentName ?? ""))
            )
        )
      ).length;

      weightedCompleted = completedDocs + completedWorkpapers * 0.5;
    } else {
      weightedCompleted = terpenuhiPerArea.get(area.id) ?? 0;
    }

    const persentase = hitungPersentase(weightedCompleted, target || 0);
    return {
      areaId: area.id,
      areaName: area.areaName,
      terpenuhi: weightedCompleted,
      target,
      persentase,
    };
  });
}

export function hitungRasioOPD(
  submissions: BaseSubmission[],
  areas: BaseMCSPArea[],
  requirementMap?: Record<string, WeightedRequirement[]>
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
    const requirements = requirementMap?.[opdName] ?? [];
    const weighted = requirements.length > 0 ? calculateWeightedRequirementCompletion(submissions.filter((s) => s.opdName === opdName), requirements) : {
      target: totalTargetPerOPD,
      completed: data.terpenuhi,
      percent: hitungPersentase(data.terpenuhi, totalTargetPerOPD),
    };

    result.push({
      opdName,
      terpenuhi: weighted.completed,
      target: weighted.target,
      persentase: weighted.percent,
      status: getStatusKepatuhan(weighted.percent),
    });
  }

  result.sort((a, b) => a.opdName.localeCompare(b.opdName));
  return result;
}

export function hitungKumulatifGlobal(
  submissions: BaseSubmission[],
  areas: BaseMCSPArea[],
  opdCount: number,
  opdRequirementMap?: Record<string, WeightedRequirement[]>
): GlobalSummary {
  if (opdRequirementMap && Object.keys(opdRequirementMap).length > 0) {
    let totalTarget = 0;
    let totalTerpenuhi = 0;

    for (const opdName of Object.keys(opdRequirementMap)) {
      const weighted = calculateWeightedRequirementCompletion(
        submissions.filter((s) => s.opdName === opdName),
        opdRequirementMap[opdName]
      );
      totalTarget += weighted.target;
      totalTerpenuhi += weighted.completed;
    }

    const persentase = hitungPersentase(totalTerpenuhi, totalTarget);
    return {
      totalTarget,
      totalTerpenuhi,
      persentase,
      ratioText: hitungRasioTeks(Number(totalTerpenuhi.toFixed(0)), totalTarget),
      status: getStatusKepatuhan(persentase),
    };
  }

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
