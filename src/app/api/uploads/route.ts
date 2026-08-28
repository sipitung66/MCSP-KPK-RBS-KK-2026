import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip"]);

function sanitizeFileBase(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._ -]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150) || "Bukti-MCSP";
}

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const requestedLabel = formData.get("fileLabel");
  if (!(file instanceof File)) return NextResponse.json({ success: false, error: "File wajib dipilih." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ success: false, error: "Ukuran maksimal setiap file adalah 100 MB." }, { status: 413 });
  if (file.size === 0) return NextResponse.json({ success: false, error: "File kosong tidak dapat diunggah." }, { status: 400 });

  const extension = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, "");
  if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_FILE_TYPES.has(file.type)) {
    return NextResponse.json({ success: false, error: "Format file harus PDF, Word, Excel, atau ZIP." }, { status: 415 });
  }
  const fileLabel = typeof requestedLabel === "string" ? requestedLabel : "Bukti MCSP";
  const fileName = `${sanitizeFileBase(fileLabel)}-${randomUUID().slice(0, 8)}${extension}`;
  const uploadDirectory = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ success: true, url: `/uploads/${fileName}` });
}
