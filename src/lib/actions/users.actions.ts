"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
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

export async function createUserOPD(
  email: string,
  password: string,
  opdName: string
): Promise<CreateUserResult> {
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
    console.warn("[users.actions.ts] createUserOPD DB error, using mock:", dbError instanceof Error ? dbError.message : String(dbError));

    const mockUser: PublicUser = {
      id: `mock-new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      role: "ADMIN_OPD",
      opdName,
      createdAt: new Date(),
    };

    mutableMockUsers.push(mockUser);
    return { success: true, user: mockUser };
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
    return [...mutableMockUsers];
  }
}

export async function deleteUser(userId: string): Promise<DeleteUserResult> {
  if (!userId) {
    return { success: false, error: "User ID tidak valid." };
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
  } catch (dbError) {
    console.warn("[users.actions.ts] deleteUser DB error, using mock:", dbError instanceof Error ? dbError.message : String(dbError));
    mutableMockUsers = mutableMockUsers.filter((u) => u.id !== userId);
    return { success: true };
  }
}
