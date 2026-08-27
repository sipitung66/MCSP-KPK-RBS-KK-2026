"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export interface TaggingProfileRecord {
  id: string;
  opdName: string;
  areaId: number;
  areaName: string;
  tags: string[];
  requiredDocs: string[];
  workpapers: string[];
}

interface SaveTaggingInput {
  opdName: string;
  areaId: number;
  tags: string[];
  requiredDocs: string[];
  workpapers: string[];
}

function cleanList(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function validateInput(input: SaveTaggingInput): SaveTaggingInput | null {
  if (!input.opdName.trim() || !Number.isInteger(input.areaId) || input.areaId <= 0) return null;
  return {
    opdName: input.opdName.trim(),
    areaId: input.areaId,
    tags: cleanList(input.tags),
    requiredDocs: cleanList(input.requiredDocs),
    workpapers: cleanList(input.workpapers),
  };
}

export async function getAllTaggingProfiles(): Promise<TaggingProfileRecord[]> {
  try {
    const profiles = await prisma.oPDTagProfile.findMany({
      include: { area: { select: { areaName: true } } },
      orderBy: [{ opdName: "asc" }, { areaId: "asc" }],
    });
    return profiles.map((profile) => ({
      id: profile.id,
      opdName: profile.opdName,
      areaId: profile.areaId,
      areaName: profile.area.areaName,
      tags: profile.tags,
      requiredDocs: profile.requiredDocs,
      workpapers: profile.workpapers,
    }));
  } catch (error) {
    console.warn("[tagging.actions.ts] Unable to load tagging profiles:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function saveTaggingProfile(input: SaveTaggingInput): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN_UTAMA") return { success: false, error: "Hanya Admin Utama yang dapat mengubah tagging." };

  const data = validateInput(input);
  if (!data) return { success: false, error: "OPD dan area wajib dipilih." };
  if (data.tags.length === 0) return { success: false, error: "Minimal satu tag harus diisi." };
  if (data.requiredDocs.length === 0 && data.workpapers.length === 0) {
    return { success: false, error: "Isi minimal satu dokumen atau kertas kerja wajib." };
  }

  try {
    await prisma.oPDTagProfile.upsert({
      where: { opdName_areaId: { opdName: data.opdName, areaId: data.areaId } },
      create: data,
      update: {
        tags: data.tags,
        requiredDocs: data.requiredDocs,
        workpapers: data.workpapers,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("[tagging.actions.ts] saveTaggingProfile failed:", error);
    return { success: false, error: "Tagging gagal disimpan. Pastikan database sudah diperbarui." };
  }
}

export async function deleteTaggingProfile(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN_UTAMA") return { success: false, error: "Hanya Admin Utama yang dapat menghapus tagging." };
  if (!id) return { success: false, error: "Profil tagging tidak valid." };

  try {
    await prisma.oPDTagProfile.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("[tagging.actions.ts] deleteTaggingProfile failed:", error);
    return { success: false, error: "Tagging gagal dihapus." };
  }
}

