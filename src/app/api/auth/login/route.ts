import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

interface LoginRequestBody {
  email?: string;
  password?: string;
}

interface LoginResponse {
  success: boolean;
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    opdName?: string;
  };
  error?: string;
}

interface MockUser {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  opdName: string | null;
}

const DEFAULT_ADMIN_EMAIL = "admin.mcsp@konawekab.go.id";
const DEFAULT_ADMIN_PASS = "AdminMCSP@Konawe2026!";
const OPD_PASSWORD = "AdminOPD@123";

const MOCK_OPD_LIST: Array<{ email: string; opdName: string }> = [
  { email: "admin.bkpsdm@konawekab.go.id", opdName: "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia" },
  { email: "admin.badan-pengelolaan-keuangan-dan-aset-daerah@konawekab.go.id", opdName: "Badan Pengelolaan Keuangan dan Aset Daerah" },
  { email: "admin.dinas-pekerjaan-umum-dan-perumahan-rakyat@konawekab.go.id", opdName: "Dinas Pekerjaan Umum dan Perumahan Rakyat" },
  { email: "admin.dinas-pendidikan-dan-kebudayaan@konawekab.go.id", opdName: "Dinas Pendidikan dan Kebudayaan" },
  { email: "admin.dinas-kesehatan@konawekab.go.id", opdName: "Dinas Kesehatan" },
  { email: "admin.dinas-sosial@konawekab.go.id", opdName: "Dinas Sosial" },
  { email: "admin.dinas-perhubungan@konawekab.go.id", opdName: "Dinas Perhubungan" },
  { email: "admin.dinas-lingkungan-hidup@konawekab.go.id", opdName: "Dinas Lingkungan Hidup" },
  { email: "admin.dinas-pertanian-dan-ketahanan-pangan@konawekab.go.id", opdName: "Dinas Pertanian dan Ketahanan Pangan" },
  { email: "admin.dinas-perindustrian-dan-perdagangan@konawekab.go.id", opdName: "Dinas Perindustrian dan Perdagangan" },
  { email: "admin.dinas-komunikasi-dan-informatika@konawekab.go.id", opdName: "Dinas Komunikasi dan Informatika" },
  { email: "admin.dinas-penanaman-modal-dan-pelayanan-terpadu-satu-pintu@konawekab.go.id", opdName: "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu" },
  { email: "admin.dinas-pariwisata@konawekab.go.id", opdName: "Dinas Pariwisata" },
  { email: "admin.dinas-pertanahan-dan-tata-ruang@konawekab.go.id", opdName: "Dinas Pertanahan dan Tata Ruang" },
  { email: "admin.inspektorat-daerah@konawekab.go.id", opdName: "Inspektorat Daerah" },
];

function buildMockUsers(): MockUser[] {
  const users: MockUser[] = [
    {
      id: "mock-admin-utama-uuid",
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASS,
      role: "ADMIN_UTAMA",
      opdName: null,
    },
  ];

  MOCK_OPD_LIST.forEach((o, idx) => {
    users.push({
      id: `mock-opd-${String(idx + 1).padStart(3, "0")}-uuid`,
      email: o.email,
      password: OPD_PASSWORD,
      role: "ADMIN_OPD",
      opdName: o.opdName,
    });
  });

  return users;
}

const GLOBAL_MOCK_USERS = buildMockUsers();

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  let body: LoginRequestBody;
  try {
    body = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body tidak valid (harus JSON)." },
      { status: 400 }
    );
  }

  const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
  const email = emailRaw.toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email dan password harus diisi." },
      { status: 400 }
    );
  }

  let userId: string | null = null;
  let userRole: UserRole | null = null;
  let userOpdName: string | undefined = undefined;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Email atau password salah." },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Email atau password salah." },
        { status: 401 }
      );
    }

    userId = user.id;
    userRole = user.role;
    userOpdName = user.opdName ?? undefined;
  } catch (dbError) {
    console.warn("[api/auth/login] DB error, using mock login:", dbError instanceof Error ? dbError.message : String(dbError));

    const mockUser = GLOBAL_MOCK_USERS.find((u) => u.email.toLowerCase() === email);
    if (!mockUser || mockUser.password !== password) {
      return NextResponse.json(
        { success: false, error: "Email atau password salah." },
        { status: 401 }
      );
    }
    userId = mockUser.id;
    userRole = mockUser.role;
    userOpdName = mockUser.opdName ?? undefined;
  }

  if (!userId || !userRole) {
    return NextResponse.json(
      { success: false, error: "Autentikasi gagal." },
      { status: 401 }
    );
  }

  const token = await createSession(userId, email, userRole, userOpdName);
  await setSessionCookie(token);

  console.warn(`[api/auth/login] Login berhasil (mock fallback): ${email} (${userRole})`);

  return NextResponse.json({
    success: true,
    user: {
      userId,
      email,
      role: userRole,
      opdName: userOpdName,
    },
  });
}
