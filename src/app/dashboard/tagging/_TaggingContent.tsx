"use client";

import { useState } from "react";
import { CheckCircle2, Edit3, ListChecks, Loader2, Plus, Save, Tags, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { getOPDTagProfile } from "@/lib/mcsp-rbs";
import { deleteTaggingProfile, saveTaggingProfile, type TaggingProfileRecord } from "@/lib/actions/tagging.actions";
import type { MCSPArea, OPDList } from "@prisma/client";

interface TaggingContentProps {
  opds: OPDList[];
  areas: MCSPArea[];
  initialProfiles: TaggingProfileRecord[];
}

export function TaggingContent({ opds, areas, initialProfiles }: TaggingContentProps) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const initialOpdName = opds[0]?.opdName ?? "";
  const initialAreaId = String(areas[0]?.id ?? "");
  const initialRequirement = getOPDTagProfile(initialOpdName).requirements.find((item) => item.areaId === Number(initialAreaId));
  const [opdName, setOpdName] = useState(initialOpdName);
  const [areaId, setAreaId] = useState(initialAreaId);
  const [tags, setTags] = useState(getOPDTagProfile(initialOpdName).tags);
  const [documents, setDocuments] = useState(initialRequirement?.requiredDocs ?? []);
  const [workpapers, setWorkpapers] = useState(initialRequirement?.workpapers ?? []);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const selectedProfile = profiles.find((profile) => profile.opdName === opdName && profile.areaId === Number(areaId));

  const loadForm = (nextOpdName: string, nextAreaId: string) => {
    const saved = profiles.find((profile) => profile.opdName === nextOpdName && profile.areaId === Number(nextAreaId));
    const fallback = getOPDTagProfile(nextOpdName);
    const requirement = saved
      ? { tags: saved.tags, requiredDocs: saved.requiredDocs, workpapers: saved.workpapers }
      : {
          tags: fallback.tags,
          requiredDocs: fallback.requirements.find((item) => item.areaId === Number(nextAreaId))?.requiredDocs ?? [],
          workpapers: fallback.requirements.find((item) => item.areaId === Number(nextAreaId))?.workpapers ?? [],
        };
    setTags(requirement.tags);
    setDocuments(requirement.requiredDocs);
    setWorkpapers(requirement.workpapers);
  };

  const handleOpdChange = (value: string) => {
    setOpdName(value);
    loadForm(value, areaId);
  };

  const handleAreaChange = (value: string) => {
    setAreaId(value);
    loadForm(opdName, value);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result = await saveTaggingProfile({
      opdName,
      areaId: Number(areaId),
      tags,
      requiredDocs: documents,
      workpapers,
    });
    if (result.success) {
      const area = areas.find((item) => item.id === Number(areaId));
      const nextProfile: TaggingProfileRecord = {
        id: selectedProfile?.id ?? `local-${Date.now()}`,
        opdName,
        areaId: Number(areaId),
        areaName: area?.areaName ?? `Area ${areaId}`,
        tags,
        requiredDocs: documents,
        workpapers,
      };
      setProfiles((current) => [
        ...current.filter((profile) => !(profile.opdName === opdName && profile.areaId === Number(areaId))),
        nextProfile,
      ].sort((a, b) => a.opdName.localeCompare(b.opdName) || a.areaId - b.areaId));
      toast({ title: "Tagging tersimpan", description: "Kewajiban OPD-area berhasil diperbarui." });
    } else {
      toast({ title: "Gagal menyimpan", description: result.error ?? "Terjadi kesalahan.", variant: "destructive" });
    }
    setSaving(false);
  };

  const baseProfile = getOPDTagProfile(opdName);
  const selectedAreaRequirement = baseProfile.requirements.find((item) => item.areaId === Number(areaId));
  const tagOptions = Array.from(new Set([...baseProfile.tags, ...(selectedProfile?.tags ?? [])]));
  const documentOptions = Array.from(new Set([
    ...(selectedAreaRequirement?.requiredDocs ?? []),
    ...(selectedProfile?.requiredDocs ?? []),
  ]));
  const workpaperOptions = Array.from(new Set([
    ...(selectedAreaRequirement?.workpapers ?? []),
    ...(selectedProfile?.workpapers ?? []),
  ]));
  const toggleItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const handleDelete = async (profile: TaggingProfileRecord) => {
    if (!confirm(`Hapus konfigurasi ${profile.opdName} - ${profile.areaName}?`)) return;
    setDeleting(profile.id);
    const result = await deleteTaggingProfile(profile.id);
    if (result.success) {
      setProfiles((current) => current.filter((item) => item.id !== profile.id));
      loadForm(opdName, areaId);
      toast({ title: "Konfigurasi dihapus", description: "Sistem kembali menggunakan tagging bawaan." });
    } else {
      toast({ title: "Gagal menghapus", description: result.error ?? "Terjadi kesalahan.", variant: "destructive" });
    }
    setDeleting(null);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-teal-50 to-white">
          <CardTitle className="flex items-center gap-2 text-base"><Edit3 className="h-5 w-5 text-teal-700" /> Form Tagging OPD</CardTitle>
          <p className="text-sm text-slate-500">Satu konfigurasi berlaku untuk satu OPD pada satu area MCSP.</p>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2"><Label>OPD</Label><Select value={opdName} onValueChange={handleOpdChange}><SelectTrigger><SelectValue placeholder="Pilih OPD" /></SelectTrigger><SelectContent>{opds.map((opd) => <SelectItem key={opd.id} value={opd.opdName}>{opd.opdName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Area MCSP</Label><Select value={areaId} onValueChange={handleAreaChange}><SelectTrigger><SelectValue placeholder="Pilih area" /></SelectTrigger><SelectContent>{areas.map((area) => <SelectItem key={area.id} value={String(area.id)}>{area.id}. {area.areaName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Tag OPD</Label><div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">{tagOptions.map((tag) => <label key={tag} className="flex cursor-pointer items-center gap-2 rounded-md bg-white p-2 text-sm text-slate-700"><input type="checkbox" checked={tags.includes(tag)} onChange={() => toggleItem(setTags, tag)} className="h-4 w-4 accent-teal-700" />{tag}</label>)}</div></div>
            <div className="space-y-2"><Label>Dokumen wajib sesuai area</Label><div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">{documentOptions.map((document) => <label key={document} className="flex cursor-pointer items-start gap-2 rounded-md bg-white p-2 text-sm text-slate-700"><input type="checkbox" checked={documents.includes(document)} onChange={() => toggleItem(setDocuments, document)} className="mt-0.5 h-4 w-4 accent-teal-700" /><span>{document}</span></label>)}</div><p className="text-xs text-slate-500">Pilih dokumen yang menjadi kewajiban OPD pada area ini.</p></div>
            <div className="space-y-2"><Label>Kertas kerja wajib sesuai area</Label><div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-violet-200 bg-violet-50/50 p-3">{workpaperOptions.map((workpaper) => <label key={workpaper} className="flex cursor-pointer items-start gap-2 rounded-md bg-white p-2 text-sm text-slate-700"><input type="checkbox" checked={workpapers.includes(workpaper)} onChange={() => toggleItem(setWorkpapers, workpaper)} className="mt-0.5 h-4 w-4 accent-violet-700" /><span>{workpaper}</span></label>)}</div><p className="text-xs text-slate-500">Pilih kertas kerja yang wajib disiapkan OPD pada area ini.</p></div>
            <Button type="submit" disabled={saving || !opdName || !areaId} className="w-full bg-teal-700 hover:bg-teal-800"><Save /> {saving ? "Menyimpan..." : selectedProfile ? "Perbarui Tagging" : "Simpan Tagging"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100"><CardTitle className="flex items-center gap-2 text-base"><ListChecks className="h-5 w-5 text-slate-700" /> Konfigurasi Tersimpan <Badge variant="secondary">{profiles.length}</Badge></CardTitle></CardHeader>
        <CardContent className="space-y-3 p-5">
          {profiles.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500"><Tags className="mx-auto mb-2 h-8 w-8 text-slate-400" />Belum ada konfigurasi tersimpan. Form menggunakan pedoman bawaan sebagai template.</div> : profiles.map((profile) => (
            <div key={profile.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-800">{profile.opdName}</p><p className="text-xs text-slate-500">Area {profile.areaId}: {profile.areaName}</p></div><div className="flex gap-1"><Button type="button" variant="outline" size="icon" title="Edit tagging" onClick={() => { setOpdName(profile.opdName); setAreaId(String(profile.areaId)); loadForm(profile.opdName, String(profile.areaId)); }}><Edit3 /></Button><Button type="button" variant="outline" size="icon" title="Hapus tagging" onClick={() => handleDelete(profile)} disabled={deleting === profile.id}>{deleting === profile.id ? <Loader2 className="animate-spin" /> : <Trash2 className="text-rose-600" />}</Button></div></div>
              <div className="mt-3 flex flex-wrap gap-1.5">{profile.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600"><span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {profile.requiredDocs.length} dokumen</span><span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-violet-600" /> {profile.workpapers.length} kertas kerja</span></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
