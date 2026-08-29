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

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type LoginFormState = {
  error?: string;
  success?: boolean;
};

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

    try {
      const user = await prisma.user.findUnique({
        where: { email: emailLower },
      });

      if (!user) return { error: "Email atau password salah" };
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) return { error: "Email atau password salah" };

      const token = await createSession(
        user.id,
        user.email,
        user.role,
        user.opdName ?? undefined
      );
      await setSessionCookie(token);
      return { success: true };
    } catch (dbError) {
      console.error("[auth.actions.ts] Database login error:", dbError);
      return { error: "Layanan autentikasi tidak tersedia. Silakan coba lagi." };
    }
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
