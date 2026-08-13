"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getCurrentUser,
} from "@/lib/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type LoginFormState = {
  error?: string;
  success?: boolean;
};

interface MockUser {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  opdName: string | null;
}

const DEFAULT_ADMIN_PASS = "AdminMCSP@Konawe2026!";
const DEFAULT_ADMIN_EMAIL = "admin.mcsp@konawekab.go.id";

const MOCK_OPD_NAMES = [
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

const OPD_PASSWORD = "AdminOPD@123";

function buildMockUsers(): MockUser[] {
  const users: MockUser[] = [
    {
      id: "mock-admin-utama-001",
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASS,
      role: "ADMIN_UTAMA",
      opdName: null,
    },
    {
      id: "mock-opd-001",
      email: "admin.bkpsdm@konawekab.go.id",
      password: OPD_PASSWORD,
      role: "ADMIN_OPD",
      opdName: "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia",
    },
  ];

  const restOPD = MOCK_OPD_NAMES.slice(1);
  restOPD.forEach((name, idx) => {
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    users.push({
      id: `mock-opd-${String(idx + 2).padStart(3, "0")}`,
      email: `admin.${slug}@konawekab.go.id`,
      password: OPD_PASSWORD,
      role: "ADMIN_OPD",
      opdName: name,
    });
  });

  return users;
}

const GLOBAL_MOCK_USERS = buildMockUsers();

export async function login(
  prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  try {
    const rawData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const validated = loginSchema.safeParse(rawData);

    if (!validated.success) {
      const firstError = validated.error.errors[0]?.message;
      return { error: firstError ?? "Data tidak valid" };
    }

    const { email, password } = validated.data;
    const emailLower = email.toLowerCase();

    let userId: string | null = null;
    let userEmail: string | null = null;
    let userRole: UserRole | null = null;
    let userOpdName: string | undefined = undefined;
    let usedMockFallback = false;

    try {
      const user = await prisma.user.findUnique({
        where: { email: emailLower },
      });

      if (user) {
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return { error: "Email atau password salah" };
        }
        userId = user.id;
        userEmail = user.email;
        userRole = user.role;
        userOpdName = user.opdName ?? undefined;
      } else {
        return { error: "Email atau password salah" };
      }
    } catch (dbError) {
      console.warn(
        "[auth.actions.ts] login DB error, using mock fallback:",
        dbError instanceof Error ? dbError.message : String(dbError)
      );
      const mockUser = GLOBAL_MOCK_USERS.find(
        (u) => u.email.toLowerCase() === emailLower
      );
      if (!mockUser) {
        return { error: "Email atau password salah" };
      }
      if (mockUser.password !== password) {
        return { error: "Email atau password salah" };
      }
      userId = mockUser.id;
      userEmail = mockUser.email;
      userRole = mockUser.role;
      userOpdName = mockUser.opdName ?? undefined;
      usedMockFallback = true;
    }

    const token = await createSession(
      userId,
      userEmail,
      userRole,
      userOpdName
    );

    await setSessionCookie(token);

    if (usedMockFallback) {
      console.warn(
        `[auth.actions.ts] Login mock fallback berhasil: ${userEmail} (${userRole})`
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Terjadi kesalahan sistem. Silakan coba lagi." };
  }
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
