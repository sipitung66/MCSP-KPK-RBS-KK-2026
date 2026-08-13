import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(): Promise<NextResponse<{ success: boolean }>> {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
