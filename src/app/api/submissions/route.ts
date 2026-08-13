import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import {
  getSubmissionsByOPD,
  getAllSubmissions,
  upsertSubmission,
} from "@/lib/actions/submissions.actions";
import type { Submission } from "@prisma/client";
import type { DocStatus } from "@prisma/client";

interface UnauthorizedResponse {
  success: boolean;
  error: string;
}

interface SubmissionsResponse {
  success: boolean;
  data: Submission[];
}

interface UpsertRequestBody {
  opdName?: string;
  areaId?: number;
  documentName?: string;
  status?: DocStatus;
  fileUrl?: string;
  note?: string;
}

interface UpsertResponse {
  success: boolean;
  submission?: Submission;
  error?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<SubmissionsResponse | UnauthorizedResponse>> {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const opdParam = searchParams.get("opd") ?? undefined;

  try {
    let submissions: Submission[];

    if (session.role === "ADMIN_UTAMA") {
      if (opdParam) {
        submissions = await getSubmissionsByOPD(opdParam);
      } else {
        submissions = await getAllSubmissions();
      }
    } else if (session.role === "ADMIN_OPD") {
      const userOPD = session.opdName;
      if (!userOPD) {
        return NextResponse.json(
          { success: false, error: "Data OPD tidak ditemukan pada sesi." },
          { status: 400 }
        );
      }
      submissions = await getSubmissionsByOPD(userOPD);
    } else {
      return NextResponse.json(
        { success: false, error: "Role user tidak dikenal." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: submissions });
  } catch (err) {
    console.error("[api/submissions] GET Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat mengambil data submissions." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<UpsertResponse | UnauthorizedResponse>> {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  let body: UpsertRequestBody;
  try {
    body = (await request.json()) as UpsertRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body tidak valid (harus JSON)." },
      { status: 400 }
    );
  }

  const opdName = typeof body.opdName === "string" ? body.opdName.trim() : "";
  const areaId = typeof body.areaId === "number" ? body.areaId : Number(body.areaId);
  const documentName = typeof body.documentName === "string" ? body.documentName.trim() : "";
  const status = (body.status === "TERPENUHI" || body.status === "BELUM_TERPENUHI") ? body.status : "BELUM_TERPENUHI";
  const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl : undefined;
  const note = typeof body.note === "string" ? body.note : undefined;

  if (!opdName || !documentName || !Number.isFinite(areaId) || areaId <= 0) {
    return NextResponse.json(
      { success: false, error: "opdName, areaId (positive number), dan documentName harus diisi." },
      { status: 400 }
    );
  }

  if (session.role === "ADMIN_OPD") {
    const userOPD = session.opdName;
    if (!userOPD) {
      return NextResponse.json(
        { success: false, error: "Data OPD tidak ditemukan pada sesi." },
        { status: 400 }
      );
    }
    if (userOPD !== opdName) {
      return NextResponse.json(
        { success: false, error: "Forbidden: ADMIN_OPD hanya bisa mengubah submissions untuk OPD sendiri." },
        { status: 403 }
      );
    }
  } else if (session.role !== "ADMIN_UTAMA") {
    return NextResponse.json(
      { success: false, error: "Role user tidak dikenal." },
      { status: 403 }
    );
  }

  try {
    const result = await upsertSubmission(opdName, areaId, documentName, status, fileUrl, note);
    if (!result.success || !result.submission) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Gagal menyimpan submission." },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, submission: result.submission });
  } catch (err) {
    console.error("[api/submissions] POST Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat menyimpan submission." },
      { status: 500 }
    );
  }
}
