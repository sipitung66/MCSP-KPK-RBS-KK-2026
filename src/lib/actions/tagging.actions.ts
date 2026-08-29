"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { TaggingHierarchy } from "@/lib/mcsp-rbs";
import type { Prisma } from "@prisma/client";

const ACTIVE_ASSESSMENT_YEAR = 2026;
const ACTIVE_PERIOD = "TAHUNAN";

export interface TaggingProfileRecord {
  id: string;
  opdName: string;
  areaId: number;
  areaName: string;
  tags: string[];
  requiredDocs: string[];
  workpapers: string[];
  hierarchy?: Record<number, TaggingHierarchy>;
}

interface SaveTaggingInput {
  opdName: string;
  areaId: number;
  tags: string[];
  requiredDocs: string[];
  workpapers: string[];
  hierarchy?: Record<number, TaggingHierarchy>;
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
    hierarchy: input.hierarchy,
  };
}

export async function getAllTaggingProfiles(): Promise<TaggingProfileRecord[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  try {
    const profiles = await prisma.oPDTagProfile.findMany({
      where: user.role === "ADMIN_OPD" ? { opdName: user.opdName ?? "" } : undefined,
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
      hierarchy: profile.hierarchy as unknown as TaggingProfileRecord["hierarchy"],
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
  if (data.requiredDocs.length === 0 && data.workpapers.length === 0) {
    return { success: false, error: "Isi minimal satu dokumen atau kertas kerja wajib." };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const where = { opdName_areaId_assessmentYear_period: { opdName: data.opdName, areaId: data.areaId, assessmentYear: ACTIVE_ASSESSMENT_YEAR, period: ACTIVE_PERIOD } };
      const existing = await transaction.oPDTagProfile.findUnique({ where });
      const saved = await transaction.oPDTagProfile.upsert({
        where,
        create: { ...data, hierarchy: data.hierarchy as Prisma.InputJsonValue | undefined, assessmentYear: ACTIVE_ASSESSMENT_YEAR, period: ACTIVE_PERIOD, updatedBy: user.userId },
        update: { tags: data.tags, requiredDocs: data.requiredDocs, workpapers: data.workpapers, hierarchy: data.hierarchy as Prisma.InputJsonValue | undefined, assessmentYear: ACTIVE_ASSESSMENT_YEAR, period: ACTIVE_PERIOD, updatedBy: user.userId },
      });
      await transaction.auditLog.create({
        data: {
          entityType: "OPDTagProfile", entityId: saved.id, action: existing ? "UPDATE" : "CREATE", actorId: user.userId,
          beforeData: existing ? JSON.parse(JSON.stringify(existing)) : undefined,
          afterData: JSON.parse(JSON.stringify(saved)),
        },
      });
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
    const existing = await prisma.oPDTagProfile.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Profil tagging tidak ditemukan." };
    await prisma.oPDTagProfile.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        entityType: "OPDTagProfile",
        entityId: id,
        action: "DELETE",
        actorId: user.userId,
        beforeData: existing.hierarchy as Prisma.InputJsonValue | undefined,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("[tagging.actions.ts] deleteTaggingProfile failed:", error);
    return { success: false, error: "Tagging gagal dihapus." };
  }
}

