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
    targetDocs: 6,
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
    targetDocs: 6,
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
    `  -> 7 Area berhasil dibuat. Total target dokumen: ${totalTarget} (25+6+30+20+35+16+6 = ${totalTarget})`
  );

  console.log("\n[2/5] Membuat 15 OPD Kabupaten Konawe...");
  for (const opdName of OPDS) {
    await prisma.oPDList.upsert({
      where: { opdName },
      update: {},
      create: { opdName },
    });
  }
  console.log(`  -> ${OPDS.length} OPD berhasil dibuat.`);

  console.log("\n[3/5] Membuat User...");
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
              opdName_areaId_documentName: {
                opdName,
                areaId: area.id,
                documentName: docName,
              },
            },
            update: {
              status: DocStatus.TERPENUHI,
              note: "Sample seed data - otomatis terpenuhi",
              submittedBy: adminEmail,
            },
            create: {
              opdName,
              areaId: area.id,
              documentName: docName,
              status: DocStatus.TERPENUHI,
              note: "Sample seed data - otomatis terpenuhi",
              submittedBy: adminEmail,
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
              opdName_areaId_documentName: {
                opdName,
                areaId: area.id,
                documentName: docName,
              },
            },
            update: {},
            create: {
              opdName,
              areaId: area.id,
              documentName: docName,
              status: DocStatus.BELUM_TERPENUHI,
              note: "Belum diunggah",
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
