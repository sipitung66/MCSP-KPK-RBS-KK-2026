export interface AreaDocumentRequirement {
  areaId: number;
  areaName: string;
  requiredDocs: string[];
  workpapers?: string[];
}

export interface OPDTagProfile {
  tags: string[];
  requirements: AreaDocumentRequirement[];
}

export interface OPDComplianceSnapshot {
  opdName: string;
  tags: string[];
  requiredDocs: number;
  completedDocs: number;
  missingDocs: string[];
  requiredWorkpapers: number;
  completedWorkpapers: number;
  missingWorkpapers: string[];
  percent: number;
  workpaperPercent: number;
  areaSummaries: Array<{
    areaId: number;
    areaName: string;
    required: number;
    completed: number;
    missing: string[];
    requiredWorkpapers: number;
    completedWorkpapers: number;
    missingWorkpapers: string[];
    percent: number;
    workpaperPercent: number;
  }>;
}

const DEFAULT_AREA_DOCUMENTS: Record<number, string[]> = {
  1: [
    "Dokumen Rencana Strategis (Renstra) SKPD",
    "Dokumen Rencana Kerja Pemerintah Daerah (RKPD)",
    "Dokumen Rencana Kinerja Tahunan (RKT)",
    "Dokumen Rencana Kerja dan Anggaran (RKA) SKPD",
    "Dokumen Laporan Realisasi Anggaran",
  ],
  2: [
    "Dokumen Rencana Pengadaan Tahunan (RPT)",
    "Dokumen Pengumuman Lelang / Seleksi",
    "Dokumen Berita Acara Hasil Pengadaan (BAHP)",
    "Dokumen Kontrak / Perjanjian Kerja",
    "Dokumen Berita Acara Serah Terima Pekerjaan",
  ],
  3: [
    "Dokumen Standar Pelayanan Minimal (SPM)",
    "Dokumen Indeks Kepuasan Masyarakat (IKM)",
    "Dokumen Maklumat Pelayanan Publik",
    "Dokumen Prosedur Operasional Standar (POS) Pelayanan",
    "Dokumen Rekapitulasi Pengaduan Masyarakat",
  ],
  4: [
    "Dokumen Rencana Pengembangan ASN",
    "Dokumen Struktur Organisasi dan Analisis Jabatan",
    "Dokumen Data Kepegawaian",
    "Dokumen Penilaian Kinerja Pegawai",
    "Dokumen Diklat / Pelatihan ASN",
  ],
  5: [
    "Dokumen Daftar Inventaris Barang (DIB)",
    "Dokumen Kartu Inventaris Barang (KIB)",
    "Dokumen Laporan Inventarisasi Barang Milik Daerah",
    "Dokumen Berita Acara Pemeriksaan Aset",
    "Dokumen Rekonsiliasi Data BMD",
  ],
  6: [
    "Dokumen Target Realisasi Pendapatan Asli Daerah (PAD)",
    "Dokumen Laporan Realisasi Pendapatan Bulanan",
    "Dokumen Rencana Strategis Peningkatan PAD",
    "Dokumen Inventarisasi Objek Pajak / Retribusi",
    "Dokumen Data Wajib Pajak Daerah",
  ],
  7: [
    "Dokumen Rencana Tahunan Inspeksi (RTI)",
    "Dokumen Laporan Hasil Audit (LHA)",
    "Dokumen Laporan Hasil Pengawasan (LHP)",
    "Dokumen Tindak Lanjut Rekomendasi Audit",
    "Dokumen Program Aksi Penguatan APIP",
  ],
};

const DEFAULT_AREA_WORKPAPERS: Record<number, string[]> = {
  1: [
    "Kertas kerja RKPD dan target kinerja",
    "Kertas kerja evaluasi capaian program",
    "Kertas kerja analisis kebutuhan anggaran",
  ],
  2: [
    "Kertas kerja pengadaan dan evaluasi lelang",
    "Kertas kerja pemantauan kontrak",
    "Kertas kerja serah terima pekerjaan",
  ],
  3: [
    "Kertas kerja analisis kepuasan masyarakat",
    "Kertas kerja SOP pelayanan dan pengaduan",
    "Kertas kerja monitoring pelayanan publik",
  ],
  4: [
    "Kertas kerja profil pegawai dan analisis beban kerja",
    "Kertas kerja penilaian kinerja ASN",
    "Kertas kerja pengembangan kompetensi",
  ],
  5: [
    "Kertas kerja inventory aset dan BMD",
    "Kertas kerja pemanfaatan dan pemeliharaan aset",
    "Kertas kerja rekonsiliasi aset daerah",
  ],
  6: [
    "Kertas kerja estimasi dan realisasi PAD",
    "Kertas kerja target pendapatan dan retribusi",
    "Kertas kerja analisis potensi daerah",
  ],
  7: [
    "Kertas kerja audit dan pengawasan internal",
    "Kertas kerja tindak lanjut rekomendasi",
    "Kertas kerja program aksi APIP",
  ],
};

const BASE_AREA_NAMES: Record<number, string> = {
  1: "Perencanaan dan Penganggaran APBD",
  2: "Pengadaan Barang dan Jasa (PBJ)",
  3: "Pelayanan Publik",
  4: "Manajemen ASN",
  5: "Pengelolaan Barang Milik Daerah (BMD)",
  6: "Optimalisasi Pendapatan Daerah",
  7: "Penguatan APIP",
};

const withWorkpapers = (
  areaId: number,
  requiredDocs: string[]
): AreaDocumentRequirement => ({
  areaId,
  areaName: BASE_AREA_NAMES[areaId] ?? `Area ${areaId}`,
  requiredDocs,
  workpapers: DEFAULT_AREA_WORKPAPERS[areaId] ?? [],
});

const DEFAULT_PROFILE: OPDTagProfile = {
  tags: ["UMUM", "Kelengkapan Dokumen", "Kertas Kerja"],
  requirements: Object.entries(DEFAULT_AREA_DOCUMENTS).map(([areaId, requiredDocs]) =>
    withWorkpapers(Number(areaId), requiredDocs)
  ),
};

const OPD_TAGGING: Record<string, OPDTagProfile> = {
  "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia": {
    tags: ["SDM", "Perencanaan", "Pengawasan", "Layanan ASN", "Kertas Kerja"],
    requirements: [
      {
        areaId: 1,
        areaName: BASE_AREA_NAMES[1],
        requiredDocs: ["Renstra SKPD", "RKA SKPD", "RKT", "Laporan Realisasi Anggaran", "Dokumen Target Kinerja ASN"],
        workpapers: ["Kertas kerja target kinerja ASN", "Kertas kerja realisasi renstra", "Kertas kerja evaluasi kebutuhan SDM"],
      },
      {
        areaId: 4,
        areaName: BASE_AREA_NAMES[4],
        requiredDocs: ["Data Pegawai", "Dokumen Analisis Jabatan", "Rekap Kinerja ASN", "Rencana Pengembangan ASN", "Dokumen Pelatihan dan Diklat"],
        workpapers: ["Kertas kerja analisis kebutuhan pegawai", "Kertas kerja penilaian kinerja", "Kertas kerja pelatihan ASN"],
      },
      {
        areaId: 7,
        areaName: BASE_AREA_NAMES[7],
        requiredDocs: ["Rencana Tahunan Inspeksi", "Laporan Hasil Audit", "Laporan Hasil Pengawasan", "Tindak Lanjut Rekomendasi", "Program Aksi APIP"],
        workpapers: ["Kertas kerja audit internal", "Kertas kerja temuan pengawasan", "Kertas kerja tindak lanjut APIP"],
      },
    ],
  },
  "Badan Pengelolaan Keuangan dan Aset Daerah": {
    tags: ["Keuangan", "Aset", "APBD", "Pengendalian", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["RKPD", "KUA", "PPK", "RAPBD", "LRA Triwulan"], workpapers: ["Kertas kerja prioritas anggaran", "Kertas kerja perhitungan kebutuhan belanja", "Kertas kerja realisasi anggaran"] },
      { areaId: 5, areaName: BASE_AREA_NAMES[5], requiredDocs: ["DIB", "KIB", "Inventarisasi BMD", "Rekonsiliasi Data BMD", "Laporan Pengelolaan Aset"], workpapers: ["Kertas kerja pemeliharaan aset", "Kertas kerja pengelolaan BMD", "Kertas kerja rekonsiliasi aset"] },
      { areaId: 6, areaName: BASE_AREA_NAMES[6], requiredDocs: ["Target PAD", "Realisasi PAD", "Retribusi Daerah", "Data Wajib Pajak Daerah", "Rencana Peningkatan PAD"], workpapers: ["Kertas kerja potensi PAD", "Kertas kerja pendapatan daerah", "Kertas kerja analisis retribusi"] },
    ],
  },
  "Dinas Pekerjaan Umum dan Perumahan Rakyat": {
    tags: ["Infrastruktur", "Pengadaan", "Perencanaan", "Aset", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["Renstra SKPD", "RKT", "RKA SKPD", "RKPD", "Laporan Realisasi APBD"], workpapers: ["Kertas kerja pemetaan kebutuhan infrastruktur", "Kertas kerja prioritas program", "Kertas kerja evaluasi anggaran"] },
      { areaId: 2, areaName: BASE_AREA_NAMES[2], requiredDocs: ["Rencana Pengadaan", "Pengumuman Lelang", "BAHP", "Kontrak", "BA Serah Terima"], workpapers: ["Kertas kerja evaluasi pelelangan", "Kertas kerja pemantauan kontrak", "Kertas kerja serah terima" ] },
      { areaId: 5, areaName: BASE_AREA_NAMES[5], requiredDocs: ["Inventarisasi Aset", "KIB", "Pemanfaatan Aset", "Rekonsiliasi Aset", "Laporan Aset Daerah"], workpapers: ["Kertas kerja daftar aset fisik", "Kertas kerja pemanfaatan aset", "Kertas kerja rekonsiliasi aset"] },
    ],
  },
  "Dinas Pendidikan dan Kebudayaan": {
    tags: ["Pendidikan", "Pelayanan", "Sumber Daya", "Mutu", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["Renstra Pendidikan", "RKT", "RKA", "RKPD", "Laporan Kinerja"], workpapers: ["Kertas kerja target pendidikan", "Kertas kerja analisis ketercapaian", "Kertas kerja kebutuhan anggaran"] },
      { areaId: 3, areaName: BASE_AREA_NAMES[3], requiredDocs: ["SPM Pendidikan", "IKM", "Maklumat Pelayanan", "POS Pelayanan", "Laporan Pengaduan"], workpapers: ["Kertas kerja indeks kepuasan", "Kertas kerja SOP pelayanan", "Kertas kerja pengaduan masyarakat"] },
      { areaId: 4, areaName: BASE_AREA_NAMES[4], requiredDocs: ["Data Kepegawaian", "Kinerja ASN", "Pengembangan SDM", "Diklat", "Mutasi Pegawai"], workpapers: ["Kertas kerja analisis SDM", "Kertas kerja mutasi pegawai", "Kertas kerja pengembangan kompetensi"] },
    ],
  },
  "Dinas Kesehatan": {
    tags: ["Kesehatan", "Pelayanan", "Kinerja", "Data", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["Renstra SKPD", "RKT", "RKA", "RKPD", "Laporan Realisasi Anggaran"], workpapers: ["Kertas kerja capaian program kesehatan", "Kertas kerja akhir tahun", "Kertas kerja kebutuhan anggaran"] },
      { areaId: 3, areaName: BASE_AREA_NAMES[3], requiredDocs: ["SPM Kesehatan", "IKM", "Maklumat Pelayanan", "POS Pelayanan", "Laporan Pengaduan"], workpapers: ["Kertas kerja survei IKM", "Kertas kerja SOP pelayanan", "Kertas kerja pengaduan pasien"] },
      { areaId: 4, areaName: BASE_AREA_NAMES[4], requiredDocs: ["Data Pegawai", "Kinerja ASN", "Pelatihan", "Mutasi", "Analisis Jabatan"], workpapers: ["Kertas kerja analisis beban kerja tenaga kesehatan", "Kertas kerja pengembangan SDM", "Kertas kerja rekap pegawai"] },
    ],
  },
  "Dinas Sosial": {
    tags: ["Sosial", "Pelayanan", "Kesejahteraan", "Data", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["Renstra SKPD", "RKT", "RKA", "RAPBD", "Laporan Realisasi"], workpapers: ["Kertas kerja program sosial", "Kertas kerja konsiderasi anggaran", "Kertas kerja evaluasi kinerja"] },
      { areaId: 3, areaName: BASE_AREA_NAMES[3], requiredDocs: ["SPM Sosial", "IKM", "Maklumat Layanan", "POS Pelayanan", "Rekap Pengaduan"], workpapers: ["Kertas kerja layanan sosial", "Kertas kerja kepuasan masyarakat", "Kertas kerja pengaduan"] },
      { areaId: 6, areaName: BASE_AREA_NAMES[6], requiredDocs: ["Data Pendapatan Program", "Realisasi Pendapatan", "Data Penerima Manfaat", "Laporan Program", "Target Kinerja"], workpapers: ["Kertas kerja program bantuan sosial", "Kertas kerja pemanfaatan anggaran", "Kertas kerja realisasi pendapatan"] },
    ],
  },
  "Dinas Perhubungan": {
    tags: ["Transportasi", "Infra", "Pengadaan", "Keamanan", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["Renstra", "RKT", "RKA", "RKPD", "Laporan Realisasi"], workpapers: ["Kertas kerja kebutuhan transportasi", "Kertas kerja evaluasi program", "Kertas kerja anggaran bidang" ] },
      { areaId: 2, areaName: BASE_AREA_NAMES[2], requiredDocs: ["Rencana Pengadaan", "Pengumuman Lelang", "BAHP", "Kontrak", "BA Serah Terima"], workpapers: ["Kertas kerja pengadaan alat transportasi", "Kertas kerja proses lelang", "Kertas kerja serah terima"] },
      { areaId: 3, areaName: BASE_AREA_NAMES[3], requiredDocs: ["SPM Layanan", "IKM", "Maklumat Pelayanan", "POS Pelayanan", "Laporan Pengaduan"], workpapers: ["Kertas kerja pelayanan transportasi", "Kertas kerja survey kepuasan", "Kertas kerja monitoring pengaduan"] },
    ],
  },
  "Dinas Lingkungan Hidup": {
    tags: ["Lingkungan", "Pemantauan", "Aset", "Layanan", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["Renstra", "RKT", "RKA", "RKPD", "Laporan Realisasi"], workpapers: ["Kertas kerja program lingkungan", "Kertas kerja prioritas kegiatan", "Kertas kerja evaluasi realisasi"] },
      { areaId: 3, areaName: BASE_AREA_NAMES[3], requiredDocs: ["SPM Lingkungan", "IKM", "Maklumat Pelayanan", "POS Pelayanan", "Rekap Pengaduan"], workpapers: ["Kertas kerja survei lingkungan", "Kertas kerja pengaduan masyarakat", "Kertas kerja SOP pelayanan"] },
      { areaId: 5, areaName: BASE_AREA_NAMES[5], requiredDocs: ["DIB", "KIB", "Inventarisasi Aset", "Rekonsiliasi Aset", "Laporan Aset"], workpapers: ["Kertas kerja aset lingkungan", "Kertas kerja pemeliharaan aset", "Kertas kerja rekonsiliasi BMD"] },
    ],
  },
  "Dinas Pertanian dan Ketahanan Pangan": {
    tags: ["Pertanian", "Pangan", "Pelayanan", "Kinerja", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["Renstra", "RKT", "RKA", "RKPD", "Laporan Realisasi"], workpapers: ["Kertas kerja program pangan", "Kertas kerja rencana produksi", "Kertas kerja evaluasi kinerja"] },
      { areaId: 3, areaName: BASE_AREA_NAMES[3], requiredDocs: ["SPM", "IKM", "Maklumat Pelayanan", "POS Pelayanan", "Laporan Pengaduan"], workpapers: ["Kertas kerja layanan pertanian", "Kertas kerja survei kepuasan", "Kertas kerja pengaduan pelayanan"] },
      { areaId: 5, areaName: BASE_AREA_NAMES[5], requiredDocs: ["DIB", "KIB", "Inventarisasi Aset", "Monitoring Aset", "Rekonsiliasi BMD"], workpapers: ["Kertas kerja inventarisasi aset", "Kertas kerja pemanfaatan aset", "Kertas kerja monitoring BMD"] },
    ],
  },
  "Dinas Perindustrian dan Perdagangan": {
    tags: ["Perdagangan", "Investasi", "Pengadaan", "Layanan", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["Renstra", "RKT", "RKA", "RKPD", "Laporan Realisasi"], workpapers: ["Kertas kerja industri dan perdagangan", "Kertas kerja anggaran prioritas", "Kertas kerja evaluasi target"] },
      { areaId: 2, areaName: BASE_AREA_NAMES[2], requiredDocs: ["Rencana Pengadaan", "Pengumuman Lelang", "BAHP", "Kontrak", "BA Serah Terima"], workpapers: ["Kertas kerja pemilihan penyedia", "Kertas kerja pengadaan barang", "Kertas kerja pengawasan kontrak"] },
      { areaId: 3, areaName: BASE_AREA_NAMES[3], requiredDocs: ["SPM", "IKM", "Maklumat Pelayanan", "POS Pelayanan", "Rekap Pengaduan"], workpapers: ["Kertas kerja pelayanan usaha", "Kertas kerja survey IKM", "Kertas kerja analisis pengaduan"] },
    ],
  },
  "Dinas Komunikasi dan Informatika": {
    tags: ["Digital", "Data", "Pelayanan", "Infrastruktur", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["Renstra", "RKT", "RKA", "RKPD", "Laporan Realisasi"], workpapers: ["Kertas kerja digitalisasi layanan", "Kertas kerja prioritas kegiatan", "Kertas kerja evaluasi program"] },
      { areaId: 2, areaName: BASE_AREA_NAMES[2], requiredDocs: ["Rencana Pengadaan", "Pengumuman Lelang", "BAHP", "Kontrak", "BA Serah Terima"], workpapers: ["Kertas kerja kebutuhan teknologi", "Kertas kerja evaluasi pengadaan", "Kertas kerja penerimaan barang"] },
      { areaId: 3, areaName: BASE_AREA_NAMES[3], requiredDocs: ["SPM", "IKM", "Maklumat Pelayanan", "POS Pelayanan", "Rekap Pengaduan"], workpapers: ["Kertas kerja layanan digital", "Kertas kerja indeks kepuasan", "Kertas kerja pengaduan publik"] },
    ],
  },
  "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu": {
    tags: ["PMPTSP", "Pelayanan", "Perizinan", "Data", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["Renstra", "RKT", "RKA", "RKPD", "Laporan Realisasi"], workpapers: ["Kertas kerja perizinan dan investasi", "Kertas kerja target pelayanan", "Kertas kerja analisis anggaran"] },
      { areaId: 3, areaName: BASE_AREA_NAMES[3], requiredDocs: ["SPM PMPTSP", "IKM", "Maklumat Pelayanan", "POS Pelayanan", "Rekap Pengaduan"], workpapers: ["Kertas kerja pelayanan perizinan", "Kertas kerja survey kepuasan", "Kertas kerja pengaduan satu pintu"] },
      { areaId: 6, areaName: BASE_AREA_NAMES[6], requiredDocs: ["Target PAD", "Realisasi Pendapatan", "Data Wajib Pajak", "Retribusi", "Laporan Pendapatan"], workpapers: ["Kertas kerja potensi pendapatan", "Kertas kerja retribusi daerah", "Kertas kerja data wajib pajak"] },
    ],
  },
  "Dinas Pariwisata": {
    tags: ["Pariwisata", "Pelayanan", "Data", "Kinerja", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["Renstra", "RKT", "RKA", "RKPD", "Laporan Realisasi"], workpapers: ["Kertas kerja program pariwisata", "Kertas kerja anggaran sektor", "Kertas kerja capaian target"] },
      { areaId: 3, areaName: BASE_AREA_NAMES[3], requiredDocs: ["SPM", "IKM", "Maklumat Pelayanan", "POS Pelayanan", "Rekap Pengaduan"], workpapers: ["Kertas kerja layanan wisata", "Kertas kerja survei kepuasan", "Kertas kerja pengaduan wisata"] },
      { areaId: 6, areaName: BASE_AREA_NAMES[6], requiredDocs: ["Target PAD", "Realisasi PAD", "Data Retribusi", "Pendapatan Wisata", "Laporan Kinerja"], workpapers: ["Kertas kerja pendapatan wisata", "Kertas kerja retribusi objek wisata", "Kertas kerja analisis PAD"] },
    ],
  },
  "Dinas Pertanahan dan Tata Ruang": {
    tags: ["Pertanahan", "Tata Ruang", "Aset", "Pengendalian", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["Renstra", "RKT", "RKA", "RKPD", "Laporan Realisasi"], workpapers: ["Kertas kerja perencanaan ruang", "Kertas kerja prioritas program", "Kertas kerja evaluasi target"] },
      { areaId: 5, areaName: BASE_AREA_NAMES[5], requiredDocs: ["DIB", "KIB", "Inventarisasi Aset", "Rekonsiliasi Data Aset", "Laporan Aset"], workpapers: ["Kertas kerja inventarisasi tanah", "Kertas kerja data aset daerah", "Kertas kerja rekonsiliasi aset"] },
      { areaId: 7, areaName: BASE_AREA_NAMES[7], requiredDocs: ["RTI", "LHA", "LHP", "Tindak Lanjut", "Program Aksi APIP"], workpapers: ["Kertas kerja pemantauan tanah", "Kertas kerja audit tata ruang", "Kertas kerja tindak lanjut APIP"] },
    ],
  },
  "Inspektorat Daerah": {
    tags: ["APIP", "Pengawasan", "Audit", "Evaluasi", "Kertas Kerja"],
    requirements: [
      { areaId: 1, areaName: BASE_AREA_NAMES[1], requiredDocs: ["Renstra Inspektorat", "RKT", "RKA", "Laporan Akuntabilitas Kinerja", "Laporan Realisasi"], workpapers: ["Kertas kerja rencana audit", "Kertas kerja evaluasi kinerja", "Kertas kerja tindak lanjut program"] },
      { areaId: 7, areaName: BASE_AREA_NAMES[7], requiredDocs: ["RTI", "LHA", "LHP", "Tindak Lanjut Rekomendasi", "Program Aksi Penguatan APIP"], workpapers: ["Kertas kerja audit internal", "Kertas kerja temuan pengawasan", "Kertas kerja monitoring tindak lanjut"] },
      { areaId: 3, areaName: BASE_AREA_NAMES[3], requiredDocs: ["Laporan Pengawasan Pelayanan", "IKM", "Temuan Pelayanan", "Rekap Pengaduan", "Evaluasi SOP"], workpapers: ["Kertas kerja evaluasi pelayanan", "Kertas kerja review SOP", "Kertas kerja temuan lapangan"] },
    ],
  },
};

const normalizeName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export function normalizeOPDName(opdName: string): string {
  return opdName.trim();
}

export function getOPDTagProfile(opdName: string): OPDTagProfile {
  const normalized = normalizeOPDName(opdName);
  const customProfile = OPD_TAGGING[normalized];

  if (customProfile) {
    return customProfile;
  }

  return {
    ...DEFAULT_PROFILE,
    tags: ["UMUM", "Kelengkapan Dokumen", "Kertas Kerja"],
  };
}

export function getRequiredDocumentsForOPD(opdName: string): AreaDocumentRequirement[] {
  return getOPDTagProfile(opdName).requirements.map((item) => ({
    ...item,
    workpapers: item.workpapers ?? DEFAULT_AREA_WORKPAPERS[item.areaId] ?? [],
  }));
}

export function getAreaRequiredDocumentNames(opdName: string, areaId: number): string[] {
  const profile = getOPDTagProfile(opdName);
  const areaRequirement = profile.requirements.find((item) => item.areaId === areaId);

  if (areaRequirement && areaRequirement.requiredDocs.length > 0) {
    return areaRequirement.requiredDocs;
  }

  return DEFAULT_AREA_DOCUMENTS[areaId] ?? [];
}

export function getAreaRequiredWorkpapers(opdName: string, areaId: number): string[] {
  const profile = getOPDTagProfile(opdName);
  const areaRequirement = profile.requirements.find((item) => item.areaId === areaId);

  if (areaRequirement) {
    return areaRequirement.workpapers ?? DEFAULT_AREA_WORKPAPERS[areaId] ?? [];
  }

  return DEFAULT_AREA_WORKPAPERS[areaId] ?? [];
}

export function getOPDComplianceSnapshot(
  opdName: string,
  submissions: Array<{ areaId: number; documentName?: string; status?: string }>
): OPDComplianceSnapshot {
  const profile = getOPDTagProfile(opdName);
  const areaSummaries = profile.requirements.map((areaRequirement) => {
    const requiredDocs = areaRequirement.requiredDocs;
    const requiredWorkpapers = areaRequirement.workpapers ?? DEFAULT_AREA_WORKPAPERS[areaRequirement.areaId] ?? [];

    const completedDocs = requiredDocs.filter((docName) =>
      submissions.some(
        (submission) =>
          submission.areaId === areaRequirement.areaId &&
          normalizeName(submission.documentName ?? "") === normalizeName(docName) &&
          submission.status === "TERPENUHI"
      )
    );

    const completedWorkpapers = requiredWorkpapers.filter((workpaper) =>
      submissions.some(
        (submission) =>
          submission.areaId === areaRequirement.areaId &&
          submission.status === "TERPENUHI" &&
          (
            normalizeName(submission.documentName ?? "") === normalizeName(workpaper) ||
            normalizeName(submission.documentName ?? "").includes(normalizeName(workpaper)) ||
            normalizeName(workpaper).includes(normalizeName(submission.documentName ?? ""))
          )
      )
    );

    const missingDocs = requiredDocs.filter((docName) => !completedDocs.includes(docName));
    const missingWorkpapers = requiredWorkpapers.filter((workpaper) => !completedWorkpapers.includes(workpaper));

    return {
      areaId: areaRequirement.areaId,
      areaName: areaRequirement.areaName,
      required: requiredDocs.length,
      completed: completedDocs.length,
      missing: missingDocs,
      requiredWorkpapers: requiredWorkpapers.length,
      completedWorkpapers: completedWorkpapers.length,
      missingWorkpapers,
      percent: requiredDocs.length === 0 ? 0 : Math.round((completedDocs.length / requiredDocs.length) * 100),
      workpaperPercent: requiredWorkpapers.length === 0 ? 0 : Math.round((completedWorkpapers.length / requiredWorkpapers.length) * 100),
    };
  });

  const requiredDocs = areaSummaries.reduce((sum, area) => sum + area.required, 0);
  const completedDocs = areaSummaries.reduce((sum, area) => sum + area.completed, 0);
  const missingDocs = areaSummaries.flatMap((area) => area.missing);

  const requiredWorkpapers = areaSummaries.reduce((sum, area) => sum + area.requiredWorkpapers, 0);
  const completedWorkpapers = areaSummaries.reduce((sum, area) => sum + area.completedWorkpapers, 0);
  const missingWorkpapers = areaSummaries.flatMap((area) => area.missingWorkpapers);

  const percent = requiredDocs === 0 ? 0 : Math.round((completedDocs / requiredDocs) * 100);
  const workpaperPercent = requiredWorkpapers === 0 ? 0 : Math.round((completedWorkpapers / requiredWorkpapers) * 100);

  return {
    opdName,
    tags: profile.tags,
    requiredDocs,
    completedDocs,
    missingDocs,
    requiredWorkpapers,
    completedWorkpapers,
    missingWorkpapers,
    percent,
    workpaperPercent,
    areaSummaries,
  };
}
