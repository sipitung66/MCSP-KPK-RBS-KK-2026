import { PrismaClient, UserRole, DocStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const AREAS = [
  {
    id: 1,
    areaName: "Perencanaan dan Penganggaran APBD",
    targetDocs: 25,
    description:
      "Area strategis terkait proses perencanaan, penyusunan, dan penganggaran APBD Kabupaten Konawe.",
    sampleDocs: [
      "Dokumen Rencana Kerja Pemerintah Daerah (RKPD)",
      "Dokumen Rencana Pendapatan dan Belanja Daerah (RAPBD)",
      "Dokumen Penetapan APBD Peraturan Daerah",
      "Dokumen Perubahan APBD (Perkap)",
      "Dokumen Rencana Strategis (Renstra) SKPD",
      "Dokumen Laporan Realisasi APBD Triwulan",
      "Dokumen Analisis Standar Belanja (ASB)",
      "Dokumen Rencana Kerja dan Anggaran (RKA) SKPD",
      "Dokumen Kebijakan Umum APBD (KUA)",
      "Dokumen Prioritas Program dan Kegiatan (PPK)",
    ],
  },
  {
    id: 2,
    areaName: "Pengadaan Barang dan Jasa (PBJ)",
    targetDocs: 13,
    description:
      "Area strategis terkait proses pengadaan barang dan jasa pemerintah sesuai Permen PUPR & LKPP.",
    sampleDocs: [
      "Dokumen Rencana Pengadaan Tahunan (RPT)",
      "Dokumen Pengumuman Lelang Seleksi",
      "Dokumen Berita Acara Hasil Pengadaan (BAHP)",
      "Dokumen Kontrak Kerja Sama",
      "Dokumen Berita Acara Serah Terima Pekerjaan",
      "Dokumen Laporan Pengadaan Tahunan",
    ],
  },
  {
    id: 3,
    areaName: "Pelayanan Publik",
    targetDocs: 30,
    description:
      "Area strategis terkait standar pelayanan publik dan pemenuhan hak warga atas layanan pemerintah.",
    sampleDocs: [
      "Dokumen Standar Pelayanan Minimal (SPM)",
      "Dokumen Indeks Kepuasan Masyarakat (IKM)",
      "Dokumen Maklumat Pelayanan Publik",
      "Dokumen Prosedur Operasional Standar (POS) Pelayanan",
      "Dokumen Rekapitulasi Pengaduan Masyarakat",
      "Dokumen Laporan Akuntabilitas Kinerja Instansi (LAKIP)",
      "Dokumen Data Base Pengaduan (DBP)",
      "Dokumen Pelayanan Terpadu Satu Pintu (PTSP)",
    ],
  },
  {
    id: 4,
    areaName: "Manajemen ASN",
    targetDocs: 20,
    description:
      "Area strategis terkait pengelolaan kepegawaian, rekrutmen, mutasi, dan pengembangan ASN.",
    sampleDocs: [
      "Dokumen Rencana Pengadaan ASN (RFA)",
      "Dokumen Pengumuman Seleksi CPNS",
      "Dokumen Daftar Urut Kepangkatan (DUK)",
      "Dokumen Evaluasi Kinerja Tahunan ASN",
      "Dokumen Laporan Dinas & SPT Perjalanan Dinas",
      "Dokumen Promosi dan Mutasi Jabatan",
      "Dokumen Diklat Prajabatan & Pengembangan",
      "Dokumen Penilaian Kompetensi Pegawai",
    ],
  },
  {
    id: 5,
    areaName: "Pengelolaan Barang Milik Daerah (BMD)",
    targetDocs: 35,
    description:
      "Area strategis terkait inventarisasi, pemanfaatan, dan penghapusan BMD sesuai Permendagri.",
    sampleDocs: [
      "Dokumen Daftar Inventaris Barang (DIB)",
      "Dokumen Laporan Inventarisasi BMD",
      "Dokumen Surat Keterangan Barang (SKB)",
      "Dokumen Berita Acara Pemeriksaan BMD",
      "Dokumen Rencana Kebutuhan Barang (RKB)",
      "Dokumen Penghapusan BMD",
      "Dokumen Pemanfaatan BMD (Pemanfaatan & Sewa)",
      "Dokumen Rekonsiliasi Data BMD",
      "Dokumen Kartu Inventaris Barang (KIB)",
    ],
  },
  {
    id: 6,
    areaName: "Optimalisasi Pendapatan Daerah",
    targetDocs: 16,
    description:
      "Area strategis terkait penerimaan PAD, retribusi, pajak, dan upaya peningkatan pendapatan asli daerah.",
    sampleDocs: [
      "Dokumen Target Realisasi Pendapatan Asli Daerah (PAD)",
      "Dokumen Laporan Realisasi Pendapatan Bulanan",
      "Dokumen Rencana Stratejik Peningkatan PAD",
      "Dokumen Inventarisasi Objek Pajak Daerah",
      "Dokumen Rekapitulasi Retribusi Daerah",
      "Dokumen Data Wajib Pajak Daerah",
    ],
  },
  {
    id: 7,
    areaName: "Penguatan APIP",
    targetDocs: 23,
    description:
      "Area strategis terkait penguatan peran Inspektorat Daerah sebagai Aparat Pengawasan Intern Pemerintah.",
    sampleDocs: [
      "Dokumen Rencana Tahunan Inspeksi (RTI)",
      "Dokumen Laporan Hasil Audit (LHA)",
      "Dokumen Laporan Hasil Pengawasan (LHP)",
      "Dokumen Tindak Lanjut Rekomendasi Audit",
      "Dokumen Capaian Kinerja APIP Tahunan",
      "Dokumen Program Aksi Penguatan APIP",
    ],
  },
];

const INDICATORS = [
  [1, "Menilai risiko korupsi pada proses perencanaan dan penganggaran melalui usulan pokok pikiran DPRD", "Perencanaan dan Penganggaran melalui usulan pokok pikiran DPRD", "Tim Anggaran/KLOP, Sekretariat Dewan, Inspektorat", 10, "BOBOT_DOKUMEN"],
  [1, "Menilai risiko korupsi pada proses perencanaan dan penganggaran melalui hibah, bansos, dan bantuan keuangan", "Perencanaan dan penganggaran yang berasal hibah, bantuan keuangan dan bansos", "Tim Anggaran/KLOP, Sekretariat Dewan, Inspektorat", 9, "BOBOT_DOKUMEN"],
  [1, "Menilai risiko korupsi pada proses perencanaan dan penganggaran melalui perjalanan dinas dan honorarium DPRD", "Perencanaan dan penganggaran pada perjalanan dinas dan honorarium DPRD", "Tim Anggaran/KLOP, Sekretariat Dewan, Inspektorat", 6, "BOBOT_DOKUMEN"],
  [2, "Memastikan transparansi dan akuntabilitas perencanaan pengadaan sejak awal tahun", "Transparansi Pengadaan Barang dan Jasa", "Sekda, BPKD, UKPBJ", 1, "BINER_0_100"],
  [2, "Meningkatkan efisiensi belanja dan mencegah fragmentasi paket", "Konsolidasi Pengadaan Barang dan Jasa", "Sekda, BPKD, UKPBJ", 2, "BERTINGKAT_0_75_25"],
  [2, "Mendapatkan harga yang kompetitif pada Pengadaan Barang dan Jasa", "Pengendalian Risiko Pemecahan Paket pada Pengadaan Langsung", "Sekda, BPKD, UKPBJ", 3, "BOBOT_TAHUN"],
  [2, "Paket Pengadaan Barang dan Jasa Strategis ditetapkan sebelum 31 Maret", "Pengadaan Barang dan Jasa Strategis", "Sekda, BPKD, UKPBJ", 2, "BERTINGKAT_0_80_100"],
  [2, "Memastikan integritas transaksi e-purchasing dan mencegah fraud", "Pengadaan Barang dan Jasa melalui E-Purchasing", "Inspektorat, OPD Terkait", 4, "BOBOT_DOKUMEN"],
  [2, "Memastikan pelaksanaan kontrak PBJ sesuai capaian pekerjaan", "Pengendalian Keterlambatan Pelaksanaan Kontrak PBJ", "PPK, Inspektorat", 1, "BINER_0_100"],
  [3, "Pemda menetapkan regulasi RTRW dan RDTR sebagai dasar pemberian izin", "Kebijakan dan Regulasi Tata Ruang", "Kepala Daerah, Sekda, DPMPTSP, OPD terkait, Inspektorat", 5, "PROPORSIONAL"],
  [3, "Mencukupi regulasi pelayanan perizinan dan mencegah praktik korupsi", "Kecukupan dan Kepatuhan Regulasi pada Pelayanan Perizinan", "Sekda, DPMPTSP, OPD terkait, Inspektorat", 6, "BOBOT_DOKUMEN"],
  [3, "Pelaksanaan penerbitan rekomendasi teknis dan perizinan sesuai ketentuan", "Pelaksanaan dan Proses Pelayanan Perizinan", "Kepala Daerah, Sekda, DPMPTSP", 3, "PROPORSIONAL"],
  [3, "Menyediakan saluran pengaduan dan publikasi penanganan pengaduan", "Layanan Pengaduan", "Sekda, DPMPTSP, OPD layanan, Inspektorat, Diskominfo/Humas", 3, "BOBOT_DOKUMEN"],
  [3, "Mencegah korupsi pada layanan publik melalui kebijakan dan regulasi", "Larangan Gratifikasi/Suap/Pemerasan pada Layanan Publik", "Sekda, DPMPTSP, OPD layanan, Inspektorat, Diskominfo/Humas", 1, "BINER_0_100"],
  [4, "Mendorong pengisian jabatan ASN yang objektif dan akuntabel", "Pengisian Jabatan Pimpinan Tinggi/Administrator", "PPK, Sekda, BKD/BPSDM, Inspektorat, TPK", 8, "BOBOT_DOKUMEN"],
  [4, "Mendorong rotasi dan mutasi ASN yang objektif dan transparan", "Rotasi dan Mutasi Pegawai", "PPK, Sekda, BKD/BPSDM, Inspektorat, TPK", 3, "BOBOT_DOKUMEN"],
  [4, "Memperkuat budaya antikorupsi melalui pelaporan kekayaan", "Kepatuhan Pelaporan LHKPN", "Sekda, Biro Hukum, BKD/BPSDM, Inspektorat", 0, "INTEROPERABILITAS_E_LHKPN"],
  [4, "Memperkuat kelembagaan UPG dalam pengendalian gratifikasi", "Pengendalian Gratifikasi", "Sekda, Biro Hukum, BKD/BPSDM, Inspektorat", 0, "INTEROPERABILITAS_GOL"],
  [5, "Mengamankan administrasi Barang Milik Daerah", "Pemutakhiran Database Aset Barang Milik Daerah", "Sekda, BPKAD, OPD Pengguna Aset, Inspektorat", 3, "BINER_0_100"],
  [5, "Mengamankan legalitas dan penguasaan fisik aset", "Peningkatan Legalitas dan Capaian Penertiban Aset", "BPKAD, OPD Pengguna Aset, Inspektorat", 5, "BOBOT_TAHUN_TRIWULAN"],
  [5, "Meningkatkan efisiensi pengadaan BMD", "Pengadaan BMD Berdasarkan RKBMD dan Efisiensi HPS", "BPKAD, OPD Pengguna Aset, UKPBJ, Inspektorat", 5, "BOBOT_DOKUMEN"],
  [5, "Mengoptimalkan pemanfaatan BMD", "Pemanfaatan Aset secara Optimal", "BPKAD, OPD Pengguna Aset, Inspektorat", 4, "BOBOT_DOKUMEN"],
  [5, "Mencegah penghapusan dan pemindahtanganan aset tidak prosedural", "Penghapusan dan Pemindahtanganan Aset", "BPKAD, OPD Pengguna Aset, Inspektorat", 5, "BINER_0_100"],
  [5, "Memastikan serah terima PSU disertai BAST dan tercatat sebagai BMD", "Penertiban PSU", "BPKAD, Dinas PUTR/PERKIM, Inspektorat", 3, "BOBOT_DOKUMEN"],
  [6, "Meningkatkan transparansi capaian Pendapatan Asli Daerah", "Digitalisasi Transparansi Pendapatan Asli Daerah", "Sekda, Bapenda, Diskominfo, Inspektorat", 4, "BOBOT_DOKUMEN"],
  [6, "Meningkatkan pajak dan menindaklanjuti hasil pengawasan", "Capaian Realisasi dan Pengawasan Pajak Daerah", "Sekda, Inspektur, BPKAD, Bapenda", 8, "AMBANG_REALISASI"],
  [6, "Melaksanakan penagihan piutang pajak daerah dan penegakan hukum", "Capaian Realisasi Penagihan Piutang Pajak Daerah", "Sekda, Bapenda, BPKAD, Hukum, Satpol PP, Inspektorat", 5, "AMBANG_PROPORSIONAL"],
  [7, "Menyelesaikan tindak lanjut rekomendasi hasil pemeriksaan BPK", "Tindak Lanjut Temuan BPK", "Inspektorat, OPD Terkait", 1, "PROPORSIONAL"],
  [7, "Melaksanakan probity audit pada pengadaan strategis daerah", "Probity Audit pada Pengadaan Strategis Daerah", "Sekda, Inspektorat, UKPBJ, OPD Terkait", 5, "BOBOT_TAHAPAN"],
  [7, "Melaksanakan pengawasan berbasis risiko untuk pencegahan korupsi", "Pengawasan dalam Rangka Pencegahan Korupsi", "Sekda, Inspektorat, Perangkat Daerah Terkait", 9, "BOBOT_DOKUMEN_PROPORSIONAL"],
  [7, "Menyelesaikan pengaduan yang terindikasi korupsi", "Tindak Lanjut Pengaduan Masyarakat", "Inspektorat", 1, "PROPORSIONAL"],
  [7, "Memperkuat SDM dan anggaran APIP", "Penguatan SDM dan Anggaran APIP", "Sekda, BKPSDM, Organisasi, BPKAD, Inspektorat", 0, "INTEROPERABILITAS_SICUKUP"],
  [7, "Memperkuat tata kelola dan pembenahan pelayanan publik berdasarkan SPI", "Tindak Lanjut Rencana Aksi SPI", "Sekda, Inspektorat, seluruh perangkat daerah terkait", 0, "INTEROPERABILITAS_SPI"],
] as const;

const OPDS: string[] = [
  "BKPSDM",
  "BPKAD",
  "Dinas PUPR",
  "Dinas Kesehatan",
  "Dinas Pendidikan",
  "Dinas Sosial",
  "Dinas Perindustrian",
  "Dinas Pertanian",
  "Dinas Perikanan",
  "Dinas LH",
  "Dinas PMD",
  "Dinas Kominfo",
  "Dinas Pariwisata",
  "Bappeda",
  "Kesbangpol",
];

const SAMPLE_OPD_FOR_SUBMISSION = [
  "BKPSDM",
  "BPKAD",
  "Dinas PUPR",
  "Dinas Kesehatan",
  "Dinas Pendidikan",
  "Bappeda",
];

const SAMPLE_OPD_FOR_ADMIN = ["BKPSDM", "BPKAD", "Dinas PUPR"];

async function main() {
  console.log("==============================================");
  console.log("  SEED MCSP KPK KABUPATEN KONAWE 2026");
  console.log("==============================================");

  console.log("\n[1/5] Membuat 7 Area Strategis MCSP KPK...");
  for (const area of AREAS) {
    await prisma.mCSPArea.upsert({
      where: { id: area.id },
      update: {
        areaName: area.areaName,
        targetDocs: area.targetDocs,
        description: area.description,
      },
      create: {
        id: area.id,
        areaName: area.areaName,
        targetDocs: area.targetDocs,
        description: area.description,
      },
    });
  }
  const totalTarget = AREAS.reduce((sum, a) => sum + a.targetDocs, 0);
  console.log(
    `  -> 7 Area berhasil dibuat. Total target dokumen: ${totalTarget} (pedoman MCSP-RBS 2026: 162)`
  );

  console.log("\n[2/6] Membuat 33 indikator resmi MCSP-RBS 2026...");
  const indicatorNumbers: Record<number, number> = {};
  for (const [areaId, objective, indicatorName, responsible, documentCount, scoringMethod] of INDICATORS) {
    indicatorNumbers[areaId] = (indicatorNumbers[areaId] ?? 0) + 1;
    const indicatorNo = indicatorNumbers[areaId];
    const indicatorId = `mcsp-2026-area-${areaId}-indicator-${indicatorNo}`;
    await prisma.mCSPIndicator.upsert({
      where: { id: indicatorId },
      update: { areaId, indicatorNo, objective, indicatorName, responsible, documentCount, scoringMethod, assessmentYear: 2026 },
      create: {
        id: indicatorId,
        areaId,
        indicatorNo,
        objective,
        indicatorName,
        responsible,
        documentCount,
        scoringMethod,
        assessmentYear: 2026,
        sourceSystem: scoringMethod.startsWith("INTEROPERABILITAS") ? scoringMethod.replace("INTEROPERABILITAS_", "") : null,
      },
    });
  }
  console.log(`  -> ${INDICATORS.length} indikator berhasil dibuat.`);

  console.log("\n[3/6] Membuat 15 OPD Kabupaten Konawe...");
  for (const opdName of OPDS) {
    await prisma.oPDList.upsert({
      where: { opdName },
      update: {},
      create: { opdName },
    });
  }
  console.log(`  -> ${OPDS.length} OPD berhasil dibuat.`);

  console.log("\n[4/6] Membuat User...");
  const adminEmail =
    process.env.DEFAULT_ADMIN_EMAIL || "admin.mcsp@konawekab.go.id";
  const adminPassword =
    process.env.DEFAULT_ADMIN_PASSWORD || "AdminMCSP@Konawe2026!";
  const hashedAdminPass = await hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedAdminPass,
      role: UserRole.ADMIN_UTAMA,
      opdName: null,
    },
    create: {
      email: adminEmail,
      password: hashedAdminPass,
      role: UserRole.ADMIN_UTAMA,
      opdName: null,
    },
  });
  console.log(`  -> ADMIN_UTAMA: ${adminEmail}`);

  for (const opdName of SAMPLE_OPD_FOR_ADMIN) {
    const email = `admin.${opdName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")}@konawekab.go.id`;
    const pass = `Admin${opdName.replace(/[^a-zA-Z0-9]/g, "")}@2026!`;
    const hashedPass = await hash(pass, 10);

    await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPass,
        role: UserRole.ADMIN_OPD,
        opdName,
      },
      create: {
        email,
        password: hashedPass,
        role: UserRole.ADMIN_OPD,
        opdName,
      },
    });
    console.log(`  -> ADMIN_OPD ${opdName}: ${email} / ${pass}`);
  }

  console.log("\n[4/5] Membuat sample Submission (TERPENUHI) untuk testing...");
  let submissionCount = 0;

  for (const area of AREAS) {
    const docsToUse = area.sampleDocs.slice(0, 3);
    for (const docName of docsToUse) {
      for (const opdName of SAMPLE_OPD_FOR_SUBMISSION) {
        try {
          await prisma.submission.upsert({
            where: {
              opdName_areaId_documentName_assessmentYear_period: {
                opdName,
                areaId: area.id,
                documentName: docName,
                assessmentYear: 2026,
                period: "TAHUNAN",
              },
            },
            update: {
              status: DocStatus.TERPENUHI,
              note: "Sample seed data - otomatis terpenuhi",
              submittedBy: adminEmail,
              assessmentYear: 2026,
              period: "TAHUNAN",
              verificationStatus: "DIVERIFIKASI",
              verifiedBy: adminEmail,
              verifiedAt: new Date(),
            },
            create: {
              opdName,
              areaId: area.id,
              documentName: docName,
              status: DocStatus.TERPENUHI,
              note: "Sample seed data - otomatis terpenuhi",
              submittedBy: adminEmail,
              assessmentYear: 2026,
              period: "TAHUNAN",
              verificationStatus: "DIVERIFIKASI",
              verifiedBy: adminEmail,
              verifiedAt: new Date(),
            },
          });
          submissionCount++;
        } catch (e) {
          // skip unique constraint conflicts
        }
      }
    }
  }

  console.log(
    `  -> ${submissionCount} Submission berhasil dibuat (status=TERPENUHI) untuk testing progress bar.`
  );

  console.log("\n[5/5] Membuat beberapa BELUM_TERPENUHI placeholder...");
  let belumCount = 0;
  for (const area of AREAS) {
    const docNames = area.sampleDocs;
    for (const opdName of SAMPLE_OPD_FOR_SUBMISSION) {
      for (const docName of docNames.slice(3, 5)) {
        try {
          await prisma.submission.upsert({
            where: {
              opdName_areaId_documentName_assessmentYear_period: {
                opdName,
                areaId: area.id,
                documentName: docName,
                assessmentYear: 2026,
                period: "TAHUNAN",
              },
            },
            update: {},
            create: {
              opdName,
              areaId: area.id,
              documentName: docName,
              status: DocStatus.BELUM_TERPENUHI,
              note: "Belum diunggah",
              assessmentYear: 2026,
              period: "TAHUNAN",
            },
          });
          belumCount++;
        } catch (e) {
          // skip
        }
      }
    }
  }
  console.log(
    `  -> ${belumCount} Submission BELUM_TERPENUHI sebagai placeholder.`
  );

  console.log("\n==============================================");
  console.log("  SEED SELESAI");
  console.log(`  Total Area      : ${AREAS.length}`);
  console.log(`  Total Target    : ${totalTarget} dokumen/OPD`);
  console.log(`  Total OPD       : ${OPDS.length}`);
  console.log(`  Total User      : 1 ADMIN_UTAMA + 3 ADMIN_OPD`);
  console.log(
    `  Total Subs TERPENUHI   : ${submissionCount}`
  );
  console.log(
    `  Total Subs BELUM : ${belumCount}`
  );
  console.log("==============================================");
}

main()
  .catch((e) => {
    console.error("SEED ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
