import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import {
  getDashboardSummary,
  getDashboardSummaryForOPD,
} from "@/lib/actions/dashboard.actions";
import type { DashboardSummary, OPDSpecificSummary } from "@/lib/actions/dashboard.actions";

interface UnauthorizedResponse {
  success: boolean;
  error: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<DashboardSummary | OPDSpecificSummary | UnauthorizedResponse>> {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  try {
    if (session.role === "ADMIN_UTAMA") {
      const summary = await getDashboardSummary();
      return NextResponse.json(summary);
    }

    if (session.role === "ADMIN_OPD") {
      const opdName = session.opdName;
      if (!opdName) {
        return NextResponse.json(
          { success: false, error: "Data OPD tidak ditemukan pada sesi." },
          { status: 400 }
        );
      }
      const summary = await getDashboardSummaryForOPD(opdName);
      return NextResponse.json(summary);
    }

    return NextResponse.json(
      { success: false, error: "Role user tidak dikenal." },
      { status: 403 }
    );
  } catch (err) {
    console.error("[api/dashboard/summary] Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat mengambil data dashboard." },
      { status: 500 }
    );
  }
}
