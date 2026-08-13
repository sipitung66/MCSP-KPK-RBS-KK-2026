import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import {
  getAllUsers,
  createUserOPD,
  deleteUser,
} from "@/lib/actions/users.actions";
import type { PublicUser } from "@/lib/actions/users.actions";

interface UnauthorizedResponse {
  success: boolean;
  error: string;
}

interface UsersGetResponse {
  success: boolean;
  data: PublicUser[];
}

interface CreateUserRequestBody {
  email?: string;
  password?: string;
  opdName?: string;
}

interface UsersPostResponse {
  success: boolean;
  user?: PublicUser;
  error?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<UsersGetResponse | UnauthorizedResponse>> {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  if (session.role !== "ADMIN_UTAMA") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Hanya ADMIN_UTAMA yang dapat mengakses data users." },
      { status: 403 }
    );
  }

  try {
    const users = await getAllUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    console.error("[api/users] GET Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat mengambil data users." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<UsersPostResponse | UnauthorizedResponse>> {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  if (session.role !== "ADMIN_UTAMA") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Hanya ADMIN_UTAMA yang dapat menambahkan user OPD." },
      { status: 403 }
    );
  }

  let body: CreateUserRequestBody;
  try {
    body = (await request.json()) as CreateUserRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body tidak valid (harus JSON)." },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const opdName = typeof body.opdName === "string" ? body.opdName.trim() : "";

  if (!email || !password || !opdName) {
    return NextResponse.json(
      { success: false, error: "Email, password, dan opdName harus diisi." },
      { status: 400 }
    );
  }

  try {
    const result = await createUserOPD(email, password, opdName);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Gagal membuat user OPD." },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, user: result.user }, { status: 201 });
  } catch (err) {
    console.error("[api/users] POST Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat membuat user OPD." },
      { status: 500 }
    );
  }
}

interface DeleteUserResponse {
  success: boolean;
  error?: string;
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<DeleteUserResponse | UnauthorizedResponse>> {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  if (session.role !== "ADMIN_UTAMA") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Hanya ADMIN_UTAMA yang dapat menghapus user." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Parameter 'id' (user ID) diperlukan." },
      { status: 400 }
    );
  }

  try {
    const result = await deleteUser(userId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Gagal menghapus user." },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/users] DELETE Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat menghapus user." },
      { status: 500 }
    );
  }
}
