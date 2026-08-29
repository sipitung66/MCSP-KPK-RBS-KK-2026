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

    const token = await createSession(user.id, user.email, user.role, user.opdName ?? undefined);
    await setSessionCookie(token);
    return NextResponse.json({ success: true, user: { userId: user.id, email: user.email, role: user.role, opdName: user.opdName ?? undefined } });
  } catch (dbError) {
    console.error("[api/auth/login] Database error:", dbError);
    return NextResponse.json({ success: false, error: "Layanan autentikasi tidak tersedia." }, { status: 503 });
  }
}
