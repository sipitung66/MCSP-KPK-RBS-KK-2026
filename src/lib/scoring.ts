export interface IndicatorScoreInput {
  completedDocuments: number;
  totalDocuments: number;
  completedPeriods?: number;
  totalPeriods?: number;
  completedStages?: number;
  totalStages?: number;
  actualValue?: number;
  targetValue?: number;
  binarySatisfied?: boolean;
}

export interface IndicatorScoreResult {
  score: number | null;
  formula: string;
  requiresSubstantiveInput: boolean;
}

function ratio(completed: number, total: number): number | null {
  if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) return null;
  return Math.min(100, Math.max(0, (completed / total) * 100));
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateIndicatorScore(method: string, input: IndicatorScoreInput): IndicatorScoreResult {
  const documents = ratio(input.completedDocuments, input.totalDocuments);
  switch (method) {
    case "BINER_0_100":
      return { score: input.binarySatisfied === undefined ? null : input.binarySatisfied ? 100 : 0, formula: "Memenuhi = 100; tidak memenuhi = 0", requiresSubstantiveInput: false };
    case "BERTINGKAT_0_75_25":
      return { score: documents === null ? null : documents === 0 ? 0 : documents >= 100 ? 100 : 75, formula: "0 jika tidak ada; 75 jika sebagian; 100 jika lengkap", requiresSubstantiveInput: false };
    case "BERTINGKAT_0_80_100":
      return { score: documents === null ? null : documents === 0 ? 0 : documents >= 100 ? 100 : 80, formula: "0 jika tidak ada; 80 jika sebagian; 100 jika lengkap", requiresSubstantiveInput: false };
    case "BOBOT_TAHUN": {
      const score = ratio(input.completedPeriods ?? input.completedDocuments, input.totalPeriods ?? input.totalDocuments);
      return { score: score === null ? null : rounded(score), formula: "Periode terpenuhi / total periode x 100", requiresSubstantiveInput: false };
    }
    case "BOBOT_TAHUN_TRIWULAN": {
      const score = ratio(input.completedPeriods ?? input.completedDocuments, input.totalPeriods ?? input.totalDocuments);
      return { score: score === null ? null : rounded(score), formula: "Periode/triwulan terpenuhi / total periode x 100", requiresSubstantiveInput: false };
    }
    case "BOBOT_TAHAPAN": {
      const score = ratio(input.completedStages ?? input.completedDocuments, input.totalStages ?? input.totalDocuments);
      return { score: score === null ? null : rounded(score), formula: "Tahapan terpenuhi / total tahapan x 100", requiresSubstantiveInput: false };
    }
    case "AMBANG_REALISASI":
    case "AMBANG_PROPORSIONAL": {
      const score = ratio(input.actualValue ?? input.completedDocuments, input.targetValue ?? input.totalDocuments);
      return { score: score === null ? null : rounded(score), formula: "Realisasi / target x 100, maksimum 100", requiresSubstantiveInput: true };
    }
    case "INTEROPERABILITAS_E_LHKPN":
    case "INTEROPERABILITAS_GOL":
    case "INTEROPERABILITAS_SICUKUP":
    case "INTEROPERABILITAS_SPI":
      return { score: input.binarySatisfied === undefined ? null : input.binarySatisfied ? 100 : 0, formula: "Terpenuhi melalui interoperabilitas = 100; tidak terpenuhi = 0", requiresSubstantiveInput: true };
    case "BOBOT_DOKUMEN":
    case "BOBOT_DOKUMEN_PROPORSIONAL":
    case "PROPORSIONAL":
    default:
      return { score: documents === null ? null : rounded(documents), formula: "Dokumen valid terpenuhi / total dokumen x 100", requiresSubstantiveInput: false };
  }
}
