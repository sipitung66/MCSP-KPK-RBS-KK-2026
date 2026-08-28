export const MCSP_WORKPAPER_OPTIONS: Record<number, Record<number, string[]>> = {
  1: {
    1: ["Data usulan pokir dewan TA 2025", "Data usulan pokir dewan TA 2026 s.d. Semester 1", "Data usulan pokir dewan berdasarkan Perkada RKPD TA 2027", "SSH yang digunakan untuk tahun 2025", "SSH yang digunakan untuk tahun 2026", "ASB yang digunakan untuk tahun 2025", "ASB yang digunakan untuk tahun 2026"],
    2: ["Daftar penyaluran hibah TA 2025", "Daftar penyaluran hibah TA 2026 s.d. Semester 1", "Daftar penyaluran bantuan keuangan TA 2025", "Daftar penyaluran bantuan keuangan TA 2026 s.d. Semester 1", "Daftar penyaluran bantuan sosial TA 2025", "Daftar penyaluran bantuan sosial TA 2026 s.d. Semester 1"],
    3: ["Realisasi Perjalanan Dinas DPRD Tahun Anggaran 2025", "Realisasi Perjalanan Dinas DPRD Tahun Anggaran 2026 (Semester 1)", "Realisasi kegiatan Sosialisasi, Lokakarya, Seminar, dan Sarasehan DPRD TA 2025", "Realisasi kegiatan Sosialisasi, Lokakarya, Seminar, dan Sarasehan DPRD TA 2026 s.d. semester 1", "Daftar rincian honorarium DPRD yang melekat pada OPD TA 2025", "Daftar rincian honorarium DPRD yang melekat pada OPD TA 2026 s.d. Semester 1"],
  },
  2: { 1: ["Daftar RUP Tahun 2026-Revisi"], 2: ["Daftar Paket Konsolidasi Tahun 2026"], 3: ["Daftar Paket Pengadaan Langsung Tahun 2024-Revisi", "Daftar Paket Pengadaan Langsung Tahun 2025-Revisi", "Daftar Paket Pengadaan Langsung Tahun 2026-Revisi"], 4: ["Paket PBJ Strategis Tahun 2026"], 5: ["Daftar Pengadaan e-Purchasing Tahun 2024-Revisi", "Daftar Pengadaan e-Purchasing Tahun 2025-Revisi", "Daftar Pengadaan e-Purchasing Tahun 2026-Revisi"], 6: [] },
  3: { 1: ["RTRW-RZWP3K (Prov)", "RTRW-RDTR (KabKota)"], 2: [], 3: ["Rekap Perizinan"], 4: [], 5: [] },
  4: { 1: ["Format Data JPT-JA Terisi (Definitif)", "Format Data_JPT-JA Terisi (Pelaksana)", "Format Data_JPT-JA Kosong", "Format Data_Disiplin Pegawai"], 2: ["Format Data_Rotasi Mutasi Pegawai"], 3: [], 4: [] },
  5: { 1: ["PEMUTAKHIRAN DATABASE ASET"], 2: ["PENINGKATAN LEGALITAS DAN CAPAIAN PENERTIBAN ASET - CAPAIAN PENERBITAN, DAFTAR LEGALITAS, DAFTAR ASET DIKUASAI PIHAK LAIN", "KOMITMEN ROADMAP PENYELESAIAN SERTIFIKASI BMD TANAH"], 3: ["PENGADAAN BMD BERDASARKAN RKBMD DAN HPS"], 4: ["PEMANFAATAN ASET SECARA OPTIMAL - DAFTAR ASET IDLE TIDAK PRODUKTIF", "PEMANFAATAN ASET SECARA OPTIMAL - DAFTAR PEMANFAATAN BMD (ADA PERJANJIAN TANPA PERJANJIAN)", "PEMANFAATAN ASET SECARA OPTIMAL - Rekapitulasi BMD"], 5: ["PEMINDAHTANGANAN DAN PENGHAPUSAN ASET"], 6: ["PENERTIBAN PRASARANA, SARANA, DAN UTILITAS (PSU)"] },
  6: { 1: ["Provinsi - Data Potensi Pajak Daerah", "Provinsi - Data Penerimaan Daerah", "Kab Kota - Data Potensi Pajak Daerah", "Data Jumlah SPPT", "Kab_Kota - Data penerimaan daerah"], 2: ["Provinsi - Target & Realisasi Pajak Daerah", "Kab Kota - Target & Realisasi Pajak Daerah"], 3: [] },
  7: { 1: [], 2: [], 3: ["Format MTL Inspektorat"], 4: ["Format MTL Pengaduan"], 5: [], 6: [] },
};

export function getMCSPWorkpaperOptions(areaId: number, indicatorNo?: number): string[] {
  const areaOptions = MCSP_WORKPAPER_OPTIONS[areaId] ?? {};
  return indicatorNo === undefined ? Object.values(areaOptions).flat() : areaOptions[indicatorNo] ?? [];
}

export function formatMCSPFileLabel(label: string, prefix: string | number): string {
  return `${prefix} ${label}`;
}

export function formatMCSPHierarchyLabel(prefix: string, label: string): string {
  return `${prefix} ${label}`;
}
