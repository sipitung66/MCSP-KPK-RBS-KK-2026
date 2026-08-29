import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "mcsp_session";
const SESSION_DURATION = "7d";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  opdName?: string;
}

export interface CurrentUser {
  userId: string;
  email: string;
  role: UserRole;
  opdName?: string;
}

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function ensureMandatoryAdminUser(): Promise<void> {
  const adminEmail = "admin.mcsp@konawekab.go.id";
  const adminPassword = "admin123@";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN_UTAMA",
        opdName: null,
      },
    });
    return;
  }

  const isCorrectPassword = await bcrypt.compare(adminPassword, existingUser.password);
  const isCorrectRole = existingUser.role === "ADMIN_UTAMA";
  const isCorrectOPD = existingUser.opdName === null;

  if (!isCorrectPassword || !isCorrectRole || !isCorrectOPD) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedPassword,
        role: "ADMIN_UTAMA",
        opdName: null,
      },
    });
  }
}

export async function createSession(
  userId: string,
  email: string,
  role: UserRole,
  opdName?: string
): Promise<string> {
  const secret = getAuthSecret();

  const token = await new SignJWT({
    userId,
    email,
    role,
    opdName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(secret);

  return token;
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const secret = getAuthSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await verifySession();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, role: true, opdName: true },
    });
    if (!user || user.email !== session.email || user.role !== session.role || user.opdName !== (session.opdName ?? null)) {
      return null;
    }
    return { userId: user.id, email: user.email, role: user.role, opdName: user.opdName ?? undefined };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + ONE_WEEK_MS),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}
