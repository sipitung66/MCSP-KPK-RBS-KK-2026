"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, Edit3, ListChecks, Loader2, Plus, Save, Tags, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { getAreaHierarchy, getOPDTagProfile, type TaggingHierarchy, type TaggingOption } from "@/lib/mcsp-rbs";
import { formatMCSPFileLabel, formatMCSPHierarchyLabel, getMCSPWorkpaperOptions } from "@/lib/mcsp-workpapers";
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
  const initialHierarchy: TaggingHierarchy = { objectives: [] };
  const [opdName, setOpdName] = useState(initialOpdName);
  const [areaId, setAreaId] = useState(initialAreaId);
  const [documents, setDocuments] = useState<string[]>([]);
  const [workpapers, setWorkpapers] = useState<string[]>([]);
  const [hierarchy, setHierarchy] = useState<TaggingHierarchy>(initialHierarchy);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState(initialHierarchy.objectives[0]?.id ?? "");
  const [selectedIndicatorId, setSelectedIndicatorId] = useState(initialHierarchy.objectives[0]?.indicators[0]?.id ?? "");
  const [hierarchyTouched, setHierarchyTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [addDialog, setAddDialog] = useState<"objective" | "indicator" | "documents" | "workpapers" | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newScore, setNewScore] = useState("");

  const selectedProfile = profiles.find((profile) => profile.opdName === opdName && profile.areaId === Number(areaId));

  const loadForm = (nextOpdName: string, nextAreaId: string) => {
    const saved = profiles.find((profile) => profile.opdName === nextOpdName && profile.areaId === Number(nextAreaId));
    const fallback = getOPDTagProfile(nextOpdName);
    const requirement = saved
      ? { requiredDocs: saved.requiredDocs, workpapers: saved.workpapers }
      : {
          requiredDocs: fallback.requirements.find((item) => item.areaId === Number(nextAreaId))?.requiredDocs ?? [],
          workpapers: fallback.requirements.find((item) => item.areaId === Number(nextAreaId))?.workpapers ?? [],
        };
    setDocuments(requirement.requiredDocs);
    setWorkpapers(requirement.workpapers);
        const savedHierarchy = saved?.hierarchy?.[Number(nextAreaId)];
        const nextHierarchy = savedHierarchy?.objectives?.length
          ? savedHierarchy
          : getAreaHierarchy(nextOpdName, Number(nextAreaId));
    setHierarchy(nextHierarchy);
    setSelectedObjectiveId(nextHierarchy.objectives[0]?.id ?? "");
    setSelectedIndicatorId(nextHierarchy.objectives[0]?.indicators[0]?.id ?? "");
    setHierarchyTouched(Boolean(saved?.hierarchy?.[Number(nextAreaId)]));
  };

  useEffect(() => {
    if (initialOpdName && initialAreaId) loadForm(initialOpdName, initialAreaId);
  }, [initialAreaId, initialOpdName, profiles]);

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
    const hierarchyDocuments = hierarchy.objectives.flatMap((objective) => objective.indicators.flatMap((indicator) => indicator.documents.map((item) => item.label)));
    const hierarchyWorkpapers = hierarchy.objectives.flatMap((objective) => objective.indicators.flatMap((indicator) => indicator.workpapers.map((item) => item.label)));
    const result = await saveTaggingProfile({
      opdName,
      areaId: Number(areaId),
      tags: selectedProfile?.tags?.length ? selectedProfile.tags : baseProfile.tags,
      requiredDocs: hierarchyDocuments,
      workpapers: hierarchyWorkpapers,
      hierarchy: { [Number(areaId)]: hierarchy },
    });
    if (result.success) {
      const area = areas.find((item) => item.id === Number(areaId));
      const nextProfile: TaggingProfileRecord = {
        id: selectedProfile?.id ?? `local-${Date.now()}`,
        opdName,
        areaId: Number(areaId),
        areaName: area?.areaName ?? `Area ${areaId}`,
        tags: [],
        requiredDocs: hierarchyDocuments,
        workpapers: hierarchyWorkpapers,
        hierarchy: { [Number(areaId)]: hierarchy },
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
  const documentOptions = Array.from(new Set([
    ...(selectedAreaRequirement?.requiredDocs ?? []),
    ...(selectedProfile?.requiredDocs ?? []),
  ]));
  const selectedObjective = hierarchy.objectives.find((item) => item.id === selectedObjectiveId) ?? hierarchy.objectives[0];
  const selectedIndicator = selectedObjective?.indicators.find((item) => item.id === selectedIndicatorId) ?? selectedObjective?.indicators[0];
  const selectedObjectiveNumber = hierarchy.objectives.findIndex((item) => item.id === selectedObjective?.id) + 1;
  const selectedIndicatorNumber = selectedObjective?.indicators.findIndex((item) => item.id === selectedIndicator?.id) + 1;
  const selectedIndicatorOptionNumber = selectedIndicatorNumber > 0 ? selectedIndicatorNumber : undefined;
  const documentChoiceOptions: TaggingOption[] = Array.from(new Map<string, TaggingOption>([
    ...(selectedIndicator?.documents ?? []),
    ...documentOptions.map((label, index) => ({ id: `document-${areaId}-${index}`, label })),
  ].map((option) => [option.label, option])).values());
  const workpaperChoiceOptions: TaggingOption[] = Array.from(new Map<string, TaggingOption>([
    ...(selectedIndicator?.workpapers ?? []),
    ...getMCSPWorkpaperOptions(Number(areaId), selectedIndicatorOptionNumber).map((label, index) => ({ id: `workpaper-${areaId}-${selectedIndicatorOptionNumber}-${index}`, label })),
    ...getMCSPWorkpaperOptions(Number(areaId), selectedIndicatorOptionNumber).map((label, index) => ({ id: `workpaper-${areaId}-${selectedIndicatorOptionNumber}-${index}`, label })),
  ].map((option) => [option.label, option])).values());
  const toggleHierarchyOption = (kind: "documents" | "workpapers", option: TaggingOption) => {
    setHierarchyTouched(true);
    setHierarchy((current) => ({
      objectives: current.objectives.map((objective) => objective.id !== selectedObjective?.id ? objective : {
        ...objective,
        indicators: objective.indicators.map((indicator) => indicator.id !== selectedIndicator?.id ? indicator : {
          ...indicator,
          [kind]: indicator[kind].some((item) => item.label === option.label)
            ? indicator[kind].filter((item) => item.label !== option.label)
            : [...indicator[kind], option],
        }),
      }),
    }));
  };

  const addHierarchyNode = (kind: "objective" | "indicator" | "documents" | "workpapers") => {
    setAddDialog(kind);
    setNewLabel("");
    setNewScore("");
  };

  const saveHierarchyNode = () => {
    if (!addDialog || !newLabel.trim()) return;
    const score = newScore.trim() ? Number(newScore) : undefined;
    if (newScore.trim() && (!Number.isFinite(score) || (score ?? 0) < 0)) return;
    setHierarchyTouched(true);
    setHierarchy((current) => {
      if (addDialog === "objective") {
        const objective = { id: `objective-${Date.now()}`, label: newLabel.trim(), indicators: [] };
        setSelectedObjectiveId(objective.id);
        setSelectedIndicatorId("");
        return { objectives: [...current.objectives, objective] };
      }
      if (addDialog === "indicator") {
        const indicator = { id: `indicator-${Date.now()}`, label: newLabel.trim(), documents: [], workpapers: [] };
        setSelectedIndicatorId(indicator.id);
        return { objectives: current.objectives.map((item) => item.id === selectedObjective?.id ? { ...item, indicators: [...item.indicators, indicator] } : item) };
      }
      const option = { id: `${addDialog}-${Date.now()}`, label: newLabel.trim(), ...(score !== undefined ? { score } : {}) };
      return { objectives: current.objectives.map((objective) => objective.id !== selectedObjective?.id ? objective : { ...objective, indicators: objective.indicators.map((indicator) => indicator.id !== selectedIndicator?.id ? indicator : { ...indicator, [addDialog]: [...indicator[addDialog], option] }) }) };
    });
    setAddDialog(null);
  };

  const deleteHierarchyNode = (kind: "objective" | "indicator" | "documents" | "workpapers", id: string) => {
    setHierarchyTouched(true);
    setHierarchy((current) => {
      if (kind === "objective") return { objectives: current.objectives.filter((item) => item.id !== id) };
      return { objectives: current.objectives.map((objective) => objective.id !== selectedObjective?.id ? objective : { ...objective, indicators: kind === "indicator" ? objective.indicators.filter((item) => item.id !== id) : objective.indicators.map((indicator) => indicator.id !== selectedIndicator?.id ? indicator : { ...indicator, [kind]: indicator[kind].filter((item) => item.id !== id) }) }) };
    });
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
      <Dialog open={addDialog !== null} onOpenChange={(open) => { if (!open) setAddDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {addDialog === "objective" ? "Tambah Tujuan" : addDialog === "indicator" ? "Tambah Indikator" : addDialog === "documents" ? "Tambah Dokumen" : "Tambah Kertas Kerja"}
            </DialogTitle>
            <DialogDescription>Isi data pilihan hierarchy yang akan digunakan untuk tagging OPD.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="hierarchy-label">Nama {addDialog === "objective" ? "tujuan" : addDialog === "indicator" ? "indikator" : addDialog === "documents" ? "dokumen" : "kertas kerja"}</Label>
              <Input id="hierarchy-label" value={newLabel} onChange={(event) => setNewLabel(event.target.value)} placeholder="Masukkan nama" autoFocus />
            </div>
            {addDialog === "workpapers" && (
              <div className="space-y-2">
                <Label htmlFor="hierarchy-score">Bobot penilaian (opsional)</Label>
                <Input id="hierarchy-score" type="number" min="0" step="0.01" value={newScore} onChange={(event) => setNewScore(event.target.value)} placeholder="Contoh: 10" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddDialog(null)}>Batal</Button>
            <Button type="button" onClick={saveHierarchyNode} disabled={!newLabel.trim() || (Boolean(newScore.trim()) && !Number.isFinite(Number(newScore)))}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-teal-50 to-white">
          <CardTitle className="flex items-center gap-2 text-base"><Edit3 className="h-5 w-5 text-teal-700" /> Form Tagging OPD</CardTitle>
          <p className="text-sm text-slate-500">Satu konfigurasi berlaku untuk satu OPD pada satu area MCSP.</p>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2"><Label>OPD</Label><Select value={opdName} onValueChange={handleOpdChange}><SelectTrigger><SelectValue placeholder="Pilih OPD" /></SelectTrigger><SelectContent>{opds.map((opd) => <SelectItem key={opd.id} value={opd.opdName}>{opd.opdName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Area MCSP</Label><Select value={areaId} onValueChange={handleAreaChange}><SelectTrigger><SelectValue placeholder="Pilih area" /></SelectTrigger><SelectContent>{areas.map((area) => <SelectItem key={area.id} value={String(area.id)}>{area.id}. {area.areaName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-4 rounded-lg border border-teal-200 bg-teal-50/60 p-4">
              <div><Label>Hierarki pilihan</Label><p className="mt-1 text-xs text-slate-600">Pilih tujuan dan indikator, lalu centang dokumen atau KK yang berlaku. Tombol tambah dipakai untuk membuat opsi baru.</p></div>
              <div className="space-y-1"><Label className="text-xs text-slate-600">Tujuan Pencegahan Korupsi</Label><p className="text-[11px] text-slate-500">Pilih tujuan yang menjadi dasar tagging OPD.</p><div className="flex gap-2"><Select value={selectedObjective?.id ?? ""} onValueChange={(value) => { setSelectedObjectiveId(value); setSelectedIndicatorId(""); setHierarchyTouched(true); }}><SelectTrigger className="flex-1"><SelectValue placeholder="Pilih tujuan pencegahan korupsi" /></SelectTrigger>
                <SelectContent>{hierarchy.objectives.map((objective, index) => <SelectItem key={objective.id} value={objective.id}>{formatMCSPHierarchyLabel(`${areaId}.${index + 1}`, objective.label)}</SelectItem>)}</SelectContent></Select><Button type="button" size="icon" variant="outline" title="Tambah tujuan" onClick={() => addHierarchyNode("objective")}><Plus /></Button>{hierarchyTouched && selectedObjective && <Button type="button" size="icon" variant="outline" title="Hapus tujuan" onClick={() => deleteHierarchyNode("objective", selectedObjective.id)}><Trash2 className="text-rose-600" /></Button>}</div>
              </div>
              <div className="space-y-1"><Label className="text-xs text-slate-600">Indikator</Label><p className="text-[11px] text-slate-500">Pilihan dokumen dan KK mengikuti indikator aktif.</p><div className="flex gap-2"><Select value={selectedIndicator?.id ?? ""} onValueChange={(value) => { setSelectedIndicatorId(value); setHierarchyTouched(true); }} disabled={!selectedObjective}><SelectTrigger className="flex-1"><SelectValue placeholder="Pilih indikator" /></SelectTrigger><SelectContent>{(selectedObjective?.indicators ?? []).map((indicator, index) => <SelectItem key={indicator.id} value={indicator.id}>{formatMCSPHierarchyLabel(`${areaId}.${hierarchy.objectives.findIndex((item) => item.id === selectedObjective?.id) + 1}.${index + 1}`, indicator.label)}</SelectItem>)}</SelectContent></Select><Button type="button" size="icon" variant="outline" title="Tambah indikator" onClick={() => addHierarchyNode("indicator")} disabled={!selectedObjective}><Plus /></Button>{hierarchyTouched && selectedIndicator && <Button type="button" size="icon" variant="outline" title="Hapus indikator" onClick={() => deleteHierarchyNode("indicator", selectedIndicator.id)}><Trash2 className="text-rose-600" /></Button>}</div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1"><Label className="text-xs text-slate-600">Dokumen</Label><p className="text-[11px] text-slate-500">Pilih satu atau lebih dokumen.</p><DropdownMenu>
                  <DropdownMenuTrigger asChild><Button type="button" variant="outline" className="w-full justify-between bg-white">Dokumen ({selectedIndicator?.documents.length ?? 0} dipilih)<ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-72 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                    {documentChoiceOptions.map((option, index) => <DropdownMenuCheckboxItem key={option.id} checked={selectedIndicator?.documents.some((item) => item.label === option.label)} onSelect={(event) => event.preventDefault()} onCheckedChange={() => toggleHierarchyOption("documents", option)}>{formatMCSPFileLabel(option.label, `${areaId}.${selectedObjectiveNumber}.${selectedIndicatorNumber}.${index + 1}`)}</DropdownMenuCheckboxItem>)}
                                      {workpaperChoiceOptions.map((option, index) => <DropdownMenuCheckboxItem key={option.id} checked={selectedIndicator?.workpapers.some((item) => item.label === option.label)} onSelect={(event) => event.preventDefault()} onCheckedChange={() => toggleHierarchyOption("workpapers", option)}>{formatMCSPFileLabel(option.label, `${areaId}.${selectedObjectiveNumber}.${selectedIndicatorNumber}.${index + 1}`)}</DropdownMenuCheckboxItem>)}
                  </DropdownMenuContent>
                </DropdownMenu><div className="flex gap-1"><Button type="button" size="icon" variant="outline" title="Tambah dokumen" onClick={() => addHierarchyNode("documents")}><Plus /></Button>{hierarchyTouched && selectedIndicator?.documents.map((option) => <Button key={option.id} type="button" size="icon" variant="ghost" title={`Hapus ${option.label}`} onClick={() => deleteHierarchyNode("documents", option.id)}><Trash2 className="h-3.5 w-3.5 text-rose-600" /></Button>)}</div></div>
                <div className="space-y-1"><Label className="text-xs text-slate-600">Kertas Kerja</Label><p className="text-[11px] text-slate-500">Pilih KK dan bobot penilaiannya.</p><DropdownMenu>
                  <DropdownMenuTrigger asChild><Button type="button" variant="outline" className="w-full justify-between bg-white">KK ({selectedIndicator?.workpapers.length ?? 0} dipilih)<ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-72 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                  </DropdownMenuContent>
                </DropdownMenu><div className="flex gap-1"><Button type="button" size="icon" variant="outline" title="Tambah KK" onClick={() => addHierarchyNode("workpapers")}><Plus /></Button>{hierarchyTouched && selectedIndicator?.workpapers.map((option) => <Button key={option.id} type="button" size="icon" variant="ghost" title={`Hapus ${option.label}`} onClick={() => deleteHierarchyNode("workpapers", option.id)}><Trash2 className="h-3.5 w-3.5 text-rose-600" /></Button>)}</div></div>
              </div>
            </div>
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
