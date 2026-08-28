"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { User, UserRole } from "@prisma/client";

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  opdName: string | null;
  createdAt: Date;
}

interface CreateUserResult {
  success: boolean;
  user?: PublicUser;
  error?: string;
}

interface DeleteUserResult {
  success: boolean;
  error?: string;
}

interface CreateOPDResult {
  success: boolean;
  opd?: { id: number; opdName: string; createdAt: Date };
  error?: string;
}

interface DeleteOPDResult {
  success: boolean;
  error?: string;
}

const MOCK_OPD_FOR_USERS: string[] = [
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

function buildMockUsers(): PublicUser[] {
  const now = new Date();
  const users: PublicUser[] = [];

  users.push({
    id: "mock-admin-utama-uuid",
    email: "admin.mcsp@konawekab.go.id",
    role: "ADMIN_UTAMA",
    opdName: null,
    createdAt: now,
  });

  MOCK_OPD_FOR_USERS.forEach((opdName, idx) => {
    const shortName = opdName.split(" ").filter((w) => w.length > 2).slice(0, 2).join("").toLowerCase();
    users.push({
      id: `mock-admin-opd-${idx}-uuid`,
      email: `admin.${shortName}@konawekab.go.id`,
      role: "ADMIN_OPD",
      opdName,
      createdAt: now,
    });
  });

  return users;
}

const GLOBAL_MOCK_USERS = buildMockUsers();
let mutableMockUsers = [...GLOBAL_MOCK_USERS];

export async function createOPD(opdName: string): Promise<CreateOPDResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN_UTAMA") {
    return { success: false, error: "Hanya Admin Utama yang dapat menambahkan OPD." };
  }

  const normalizedName = opdName.trim().replace(/\s+/g, " ");
  if (!normalizedName) return { success: false, error: "Nama OPD wajib diisi." };
  if (normalizedName.length < 3) return { success: false, error: "Nama OPD terlalu pendek." };

  try {
    const created = await prisma.oPDList.create({
      data: { opdName: normalizedName },
      select: { id: true, opdName: true, createdAt: true },
    });
    return { success: true, opd: created };
  } catch (dbError) {
    const message = dbError instanceof Error ? dbError.message : String(dbError);
    if (message.toLowerCase().includes("unique") || message.toLowerCase().includes("duplicate")) {
      return { success: false, error: "OPD tersebut sudah terdaftar." };
    }
    console.warn("[users.actions.ts] createOPD DB error:", message);
    return { success: false, error: "OPD gagal ditambahkan. Periksa koneksi database." };
  }
}

export async function createUserOPD(
  email: string,
  password: string,
  opdName: string
): Promise<CreateUserResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN_UTAMA") return { success: false, error: "Hanya Admin Utama yang dapat mengelola user OPD." };
  if (!email || !password || !opdName) {
    return { success: false, error: "Email, password, dan nama OPD harus diisi." };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "ADMIN_OPD",
        opdName,
      },
      select: {
        id: true,
        email: true,
        role: true,
        opdName: true,
        createdAt: true,
      },
    });

    return { success: true, user: created };
  } catch (dbError) {
    console.error("[users.actions.ts] createUserOPD DB error:", dbError);
    return { success: false, error: "User gagal dibuat karena database tidak tersedia." };
  }
}

export async function getAllUsers(): Promise<PublicUser[]> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        opdName: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { email: "asc" }],
    });
    return users;
  } catch (dbError) {
    console.warn("[users.actions.ts] getAllUsers DB error, using mock:", dbError instanceof Error ? dbError.message : String(dbError));
    return [];
  }
}

export async function deleteUser(userId: string): Promise<DeleteUserResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN_UTAMA") return { success: false, error: "Hanya Admin Utama yang dapat menghapus user." };
  if (!userId) {
    return { success: false, error: "User ID tidak valid." };
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
  } catch (dbError) {
    console.error("[users.actions.ts] deleteUser DB error:", dbError);
    return { success: false, error: "User gagal dihapus karena database tidak tersedia." };
  }
}

export async function deleteOPD(opdName: string): Promise<DeleteOPDResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN_UTAMA") return { success: false, error: "Hanya Admin Utama yang dapat menghapus OPD." };
  if (!opdName.trim()) return { success: false, error: "Nama OPD tidak valid." };

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.user.deleteMany({ where: { opdName } });
      await transaction.submission.deleteMany({ where: { opdName } });
      await transaction.oPDTagProfile.deleteMany({ where: { opdName } });
      await transaction.oPDList.delete({ where: { opdName } });
    });
    return { success: true };
  } catch (dbError) {
    console.warn("[users.actions.ts] deleteOPD failed:", dbError instanceof Error ? dbError.message : String(dbError));
    return { success: false, error: "OPD gagal dihapus. Periksa koneksi database." };
  }
}
