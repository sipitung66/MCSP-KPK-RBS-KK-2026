"use client";

import { useState } from "react";
import {
  Upload,
  Save,
  FileText,
  CheckCircle2,
  Circle,
  Search,
  Filter,
  Folder,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { getSubmissionsByOPD, upsertSubmission, verifySubmission } from "@/lib/actions/submissions.actions";
import { formatMCSPFileLabel, formatMCSPHierarchyLabel } from "@/lib/mcsp-workpapers";
import {
  getAreaRequiredDocumentNames,
  getAreaRequiredWorkpapers,
  getAreaHierarchy,
  getOPDComplianceSnapshot,
  getRequiredDocumentsForOPD,
} from "@/lib/mcsp-rbs";
import type { OPDTaggingOverrides } from "@/lib/mcsp-rbs";
import type { MCSPArea, OPDList, Submission, DocStatus, VerificationStatus } from "@prisma/client";

interface ClientUser {
  email: string;
  role: "ADMIN_UTAMA" | "ADMIN_OPD";
  opdName: string | null;
}

const AREA_DOCUMENTS: Record<number, string[]> = {
  1: ["Dokumen Perencanaan Strategis (Renstra)", "Dokumen Rencana Kinerja Tahunan (RKT)", "Dokumen Rencana Aksi Pencegahan Korupsi (RAKK)", "Laporan Kinerja Tahunan", "Dokumen Analisis Jabatan"],
  2: ["SOP Pengelolaan Keuangan", "Laporan Realisasi Anggaran", "Dokumen Pertanggungjawaban Keuangan"],
  3: ["Dokumen Perencanaan Pengadaan", "SOP Pengadaan Barang/Jasa", "Laporan Pelaksanaan Pengadaan", "Dokumen Kontrak Pengadaan", "Laporan Hasil Pemeriksaan Pengadaan"],
  4: ["SOP Manajemen Kepegawaian", "Dokumen Mutasi Jabatan", "Laporan Penilaian Kinerja Pegawai", "Dokumen Penerimaan Pegawai"],
  5: ["SOP Pelayanan Publik", "Standar Pelayanan Minimal (SPM)", "Laporan Kepuasan Masyarakat", "Dokumen Maklumat Pelayanan", "SOP Pengaduan Masyarakat", "Buku Regulasi Pelayanan", "Dokumen Inovasi Pelayanan"],
  6: ["SOP Pengelolaan Aset", "Dokumen Inventarisasi Aset", "Laporan Pemanfaatan Aset"],
  7: ["Laporan Kinerja Pengawasan", "Dokumen Tindak Lanjut Hasil Pengawasan"],
};

interface SubmissionsContentProps {
  user: ClientUser;
  areas: MCSPArea[];
  opds: OPDList[];
  initialSubmissions: Submission[];
  taggingOverrides: OPDTaggingOverrides;
}

export function SubmissionsContent({ user, areas, opds, initialSubmissions, taggingOverrides }: SubmissionsContentProps) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState<number | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | DocStatus>("all");
  const [activeTab, setActiveTab] = useState<string>("unggah");
  const [selectedArea, setSelectedArea] = useState<number | "">("");
  const [evidenceType, setEvidenceType] = useState<"DOKUMEN" | "KERTAS_KERJA">("DOKUMEN");
  const [selectedDoc, setSelectedDoc] = useState<string>("");
  const [selectedWorkpaper, setSelectedWorkpaper] = useState<string>("");
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [selectedIndicator, setSelectedIndicator] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<DocStatus>("TERPENUHI");
  const [fileUrl, setFileUrl] = useState("");
  const [workpaperUrl, setWorkpaperUrl] = useState("");
  const [note, setNote] = useState("");
  const [expandedAreas, setExpandedAreas] = useState<Record<number, boolean>>({});
  const [filterOPD, setFilterOPD] = useState<string>("all");

  const toggleArea = (areaId: number) => {
    setExpandedAreas((prev) => ({ ...prev, [areaId]: !prev[areaId] }));
  };

  const currentOpdName =
    user.role === "ADMIN_UTAMA"
      ? filterOPD !== "all"
        ? filterOPD
        : opds[0]?.opdName
      : user.opdName ?? undefined;

  const opdComplianceSnapshot =
    currentOpdName ? getOPDComplianceSnapshot(currentOpdName, submissions, taggingOverrides) : null;

  const requiredDocumentGroups = currentOpdName
    ? getRequiredDocumentsForOPD(currentOpdName, taggingOverrides)
    : [];

  const selectedAreaRequirement = selectedArea
    ? requiredDocumentGroups.find((group) => group.areaId === Number(selectedArea))
    : undefined;

  const refreshSubmissions = async () => {
    const subs = await getSubmissionsByOPD(currentOpdName);
    setSubmissions(subs);
  };

  const handleFilterOPDChange = async (v: string) => {
    setFilterOPD(v);
    const opdN = v === "all" ? undefined : v;
    const subs = await getSubmissionsByOPD(opdN);
    setSubmissions(subs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedEvidence = evidenceType === "DOKUMEN" ? selectedDoc : selectedWorkpaper;
    if (!selectedArea || !selectedEvidence) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Pilih Area Strategis dan Nama Dokumen.",
        variant: "destructive",
      });
      return;
    }
    const targetOpd =
      user.role === "ADMIN_UTAMA"
        ? filterOPD !== "all"
          ? filterOPD
          : opds[0]?.opdName
        : user.opdName ?? undefined;

    if (!targetOpd) {
      toast({
        title: "OPD Tidak Ditemukan",
        description: "Pilih OPD terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    if (selectedFile && selectedFile.size > 100 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Ukuran maksimal setiap file adalah 100 MB.", variant: "destructive" });
      return;
    }
    setSaving("form");
    try {
      let uploadedUrl = evidenceType === "DOKUMEN" ? fileUrl : workpaperUrl;
      if (selectedFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        const selectedOptions = evidenceType === "DOKUMEN" ? hierarchicalDocuments : hierarchicalWorkpapers;
        const selectedOptionIndex = selectedOptions.findIndex((item) => item.label === selectedEvidence);
        const objectiveNumber = hierarchy.objectives.findIndex((item) => item.id === objective?.id) + 1;
        const indicatorNumber = objective?.indicators.findIndex((item) => item.id === indicator?.id) + 1;
        const itemPrefix = selectedOptionIndex >= 0
          ? `${selectedArea}.${objectiveNumber}.${indicatorNumber}.${selectedOptionIndex + 1}`
          : selectedEvidence;
        formData.append("fileLabel", formatMCSPFileLabel(selectedEvidence, itemPrefix));
        const uploadResponse = await fetch("/api/uploads", { method: "POST", body: formData });
        const uploadResult = await uploadResponse.json() as { success?: boolean; url?: string; error?: string };
        if (!uploadResponse.ok || !uploadResult.success || !uploadResult.url) throw new Error(uploadResult.error ?? "Upload file gagal.");
        uploadedUrl = uploadResult.url;
      }
      const result = await upsertSubmission(
        targetOpd,
        Number(selectedArea),
        selectedEvidence,
        status,
        evidenceType === "DOKUMEN" ? uploadedUrl || undefined : undefined,
        note || undefined,
        evidenceType === "KERTAS_KERJA" ? uploadedUrl || undefined : undefined
      );
      if (result.success) {
        toast({
          title: "Berhasil Disimpan",
          description: `Data "${selectedEvidence}" berhasil diperbarui.`,
        });
        setSelectedDoc(""); setSelectedWorkpaper(""); setSelectedObjective(""); setSelectedIndicator(""); setSelectedFile(null); setFileUrl(""); setWorkpaperUrl(""); setNote(""); setStatus("TERPENUHI");
        await refreshSubmissions();
      } else {
        toast({
          title: "Gagal Menyimpan",
          description: result.error ?? "Terjadi kesalahan.",
          variant: "destructive",
        });
      }
    } finally {
      setUploading(false);
      setSaving(null);
    }
  };

  const handleQuickUpdate = async (sub: Submission, newStatus: DocStatus) => {
    setSaving(sub.id);
    try {
      const result = await upsertSubmission(
        sub.opdName, sub.areaId, sub.documentName,
        newStatus, sub.fileUrl ?? undefined, sub.note ?? undefined
        , sub.workpaperUrl ?? undefined
      );
      if (result.success) {
        toast({ title: "Status Diperbarui", description: `Status diubah menjadi ${newStatus}.` });
        await refreshSubmissions();
      } else {
        toast({ title: "Gagal", description: result.error ?? "", variant: "destructive" });
      }
    } finally {
      setSaving(null);
    }
  };

  const handleVerification = async (sub: Submission, nextStatus: VerificationStatus) => {
    setSaving(`verify-${sub.id}`);
    const result = await verifySubmission(sub.id, nextStatus);
    if (result.success) {
      toast({ title: "Verifikasi disimpan", description: `Bukti ${sub.documentName} telah diperbarui.` });
      await refreshSubmissions();
    } else {
      toast({ title: "Verifikasi gagal", description: result.error ?? "Terjadi kesalahan.", variant: "destructive" });
    }
    setSaving(null);
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!s.documentName.toLowerCase().includes(term) && !s.opdName.toLowerCase().includes(term)) return false;
    }
    if (filterArea !== "all" && s.areaId !== Number(filterArea)) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const documentListForSelectedArea = selectedArea
    ? getAreaRequiredDocumentNames(
        currentOpdName ?? user.opdName ?? opds[0]?.opdName ?? "",
        Number(selectedArea), taggingOverrides
      )
    : [];

  const workpaperListForSelectedArea = selectedArea
    ? getAreaRequiredWorkpapers(
        currentOpdName ?? user.opdName ?? opds[0]?.opdName ?? "",
        Number(selectedArea), taggingOverrides
      )
    : [];

  const hierarchy = selectedArea
    ? getAreaHierarchy(currentOpdName ?? user.opdName ?? opds[0]?.opdName ?? "", Number(selectedArea), taggingOverrides)
    : { objectives: [] };
  const objective = hierarchy.objectives.find((item) => item.id === selectedObjective) ?? hierarchy.objectives[0];
  const indicator = objective?.indicators.find((item) => item.id === selectedIndicator) ?? objective?.indicators[0];
  const hierarchicalDocuments = indicator?.documents ?? [];
  const hierarchicalWorkpapers = indicator?.workpapers ?? [];

  return (
    <div className="space-y-6">
      {currentOpdName && opdComplianceSnapshot && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Tagging OPD</p>
                  <h3 className="mt-2 text-xl font-bold text-slate-800">{currentOpdName}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {opdComplianceSnapshot.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 min-w-[320px] xl:min-w-[520px]">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Dokumen Wajib</p>
                  <p className="mt-2 text-2xl font-black text-slate-800">{opdComplianceSnapshot.requiredDocs}</p>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-violet-700">Kertas Kerja</p>
                  <p className="mt-2 text-2xl font-black text-violet-700">{opdComplianceSnapshot.requiredWorkpapers}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-700">Terpenuhi</p>
                  <p className="mt-2 text-2xl font-black text-emerald-700">{opdComplianceSnapshot.completedDocs + opdComplianceSnapshot.completedWorkpapers}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-amber-700">Kelengkapan</p>
                  <p className="mt-2 text-2xl font-black text-amber-700">{opdComplianceSnapshot.percent}%</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-sm font-bold text-slate-700">Daftar Dokumen dan Kertas Kerja Wajib</p>
                <div className="mt-3 space-y-3">
                  {requiredDocumentGroups.map((group) => (
                    <div key={group.areaId} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">{group.areaName}</p>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {group.requiredDocs.length + (group.workpapers?.length ?? 0)} item
                        </Badge>
                      </div>

                      <div className="mt-3">
                        <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-slate-500">Dokumen</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {group.requiredDocs.map((doc) => (
                            <Badge
                              key={`${group.areaId}-${doc}`}
                              variant={
                                submissions.some(
                                  (submission) =>
                                    submission.areaId === group.areaId &&
                                    submission.documentName === doc &&
                                    submission.status === "TERPENUHI"
                                )
                                  ? "success"
                                  : "secondary"
                              }
                              className={cn(
                                "text-[10px] px-2 py-1",
                                submissions.some(
                                  (submission) =>
                                    submission.areaId === group.areaId &&
                                    submission.documentName === doc &&
                                    submission.status === "TERPENUHI"
                                )
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-700"
                              )}
                            >
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {(group.workpapers ?? []).length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-violet-600">Kertas Kerja</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(group.workpapers ?? []).map((paper) => (
                              <Badge
                                key={`${group.areaId}-paper-${paper}`}
                                variant={
                                  submissions.some(
                                    (submission) =>
                                      submission.areaId === group.areaId &&
                                      submission.status === "TERPENUHI" &&
                                      (
                                        submission.documentName === paper ||
                                        submission.documentName.toLowerCase().includes(paper.toLowerCase()) ||
                                        paper.toLowerCase().includes(submission.documentName.toLowerCase())
                                      )
                                  )
                                    ? "success"
                                    : "secondary"
                                }
                                className={cn(
                                  "text-[10px] px-2 py-1",
                                  submissions.some(
                                    (submission) =>
                                      submission.areaId === group.areaId &&
                                      submission.status === "TERPENUHI" &&
                                      (
                                        submission.documentName === paper ||
                                        submission.documentName.toLowerCase().includes(paper.toLowerCase()) ||
                                        paper.toLowerCase().includes(submission.documentName.toLowerCase())
                                      )
                                  )
                                    ? "bg-violet-100 text-violet-800"
                                    : "bg-slate-100 text-slate-700"
                                )}
                              >
                                {paper}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-bold text-rose-700">Dokumen yang masih belum lengkap</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {opdComplianceSnapshot.missingDocs.length === 0 ? (
                      <Badge variant="success" className="bg-emerald-100 text-emerald-800">
                        Semua dokumen wajib sudah terpenuhi
                      </Badge>
                    ) : (
                      opdComplianceSnapshot.missingDocs.slice(0, 12).map((doc) => (
                        <Badge key={doc} variant="secondary" className="bg-white text-rose-700 border border-rose-200">
                          {doc}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                  <p className="text-sm font-bold text-violet-700">Kertas kerja yang belum lengkap</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {opdComplianceSnapshot.missingWorkpapers.length === 0 ? (
                      <Badge variant="success" className="bg-emerald-100 text-emerald-800">
                        Semua kertas kerja wajib sudah ada
                      </Badge>
                    ) : (
                      opdComplianceSnapshot.missingWorkpapers.slice(0, 12).map((paper) => (
                        <Badge key={paper} variant="secondary" className="bg-white text-violet-700 border border-violet-200">
                          {paper}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user.role === "ADMIN_UTAMA" && (
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Label className="text-sm font-semibold shrink-0">Tampilkan Data OPD:</Label>
              <Select value={filterOPD} onValueChange={handleFilterOPDChange}>
                <SelectTrigger className="w-full sm:max-w-md">
                  <SelectValue placeholder="Pilih OPD..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua OPD</SelectItem>
                  {opds.map((o) => (
                    <SelectItem key={o.id} value={o.opdName}>{o.opdName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:inline-flex h-auto p-1 bg-slate-100 mb-4">
          <TabsTrigger value="unggah" className="px-4 py-2 text-sm data-[state=active]:bg-white rounded-md gap-1.5">
            <Upload className="w-4 h-4" /> Unggah / Perbarui Dokumen
          </TabsTrigger>
          <TabsTrigger value="daftar" className="px-4 py-2 text-sm data-[state=active]:bg-white rounded-md gap-1.5">
            <FileText className="w-4 h-4" /> Daftar Seluruh Dokumen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unggah" className="mt-0">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-br from-indigo-50 to-white">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Form Unggah Dokumen Bukti Dukung
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Isi data dokumen yang telah dipenuhi
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="p-5 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Area Strategis <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={String(selectedArea)}
                      onValueChange={(v) => { setSelectedArea(Number(v)); setSelectedDoc(""); setSelectedWorkpaper(""); setSelectedObjective(""); setSelectedIndicator(""); }}
                    >
                      <SelectTrigger><SelectValue placeholder="Pilih Area..." /></SelectTrigger>
                      <SelectContent>
                        {areas.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>{a.areaName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Tujuan Pencegahan Korupsi</Label>
                    <Select value={objective?.id ?? ""} onValueChange={(value) => { setSelectedObjective(value); setSelectedIndicator(""); }} disabled={!selectedArea}>
                      <SelectTrigger><SelectValue placeholder="Pilih tujuan..." /></SelectTrigger>
                      <SelectContent>{hierarchy.objectives.map((item, index) => <SelectItem key={item.id} value={item.id}>{formatMCSPHierarchyLabel(`${selectedArea}.${index + 1}`, item.label)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Indikator</Label>
                    <Select value={indicator?.id ?? ""} onValueChange={setSelectedIndicator} disabled={!objective}>
                      <SelectTrigger><SelectValue placeholder="Pilih indikator..." /></SelectTrigger>
                      <SelectContent>{(objective?.indicators ?? []).map((item, index) => <SelectItem key={item.id} value={item.id}>{formatMCSPHierarchyLabel(`${selectedArea}.${hierarchy.objectives.findIndex((entry) => entry.id === objective?.id) + 1}.${index + 1}`, item.label)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Jenis Pemenuhan <span className="text-rose-500">*</span></Label>
                    <Select value={evidenceType} onValueChange={(v) => { setEvidenceType(v as "DOKUMEN" | "KERTAS_KERJA"); setSelectedDoc(""); setSelectedWorkpaper(""); }} disabled={!selectedArea}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOKUMEN">Dokumen</SelectItem>
                        <SelectItem value="KERTAS_KERJA">Kertas Kerja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      {evidenceType === "DOKUMEN" ? "Nama Dokumen" : "Nama Kertas Kerja"} <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={evidenceType === "DOKUMEN" ? selectedDoc : selectedWorkpaper}
                      onValueChange={evidenceType === "DOKUMEN" ? setSelectedDoc : setSelectedWorkpaper}
                      disabled={!selectedArea}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedArea ? `Pilih ${evidenceType === "DOKUMEN" ? "dokumen" : "kertas kerja"}...` : "Pilih Area dulu"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(evidenceType === "DOKUMEN" ? hierarchicalDocuments : hierarchicalWorkpapers).map((item, index) => (
                          <SelectItem key={item.id} value={item.label}>{formatMCSPFileLabel(item.label, `${selectedArea}.${hierarchy.objectives.findIndex((entry) => entry.id === objective?.id) + 1}.${objective?.indicators.findIndex((entry) => entry.id === indicator?.id) + 1}.${index + 1}`)}{item.score !== undefined ? ` (bobot ${item.score})` : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Upload file (maksimal 100 MB)</Label>
                    <Input type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
                    <p className="text-[11px] text-slate-500">Pilih file bukti atau gunakan URL di samping.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Status Pemenuhan</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as DocStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TERPENUHI">Terpenuhi</SelectItem>
                        <SelectItem value="BELUM_TERPENUHI">Belum Terpenuhi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{evidenceType === "DOKUMEN" ? "URL File Dokumen" : "URL Kertas Kerja"}</Label>
                    <Input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={evidenceType === "DOKUMEN" ? fileUrl : workpaperUrl}
                      onChange={(e) => evidenceType === "DOKUMEN" ? setFileUrl(e.target.value) : setWorkpaperUrl(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-500">URL {evidenceType === "DOKUMEN" ? "file dokumen" : "file kertas kerja"} yang diunggah OPD.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">URL Kertas Kerja</Label>
                    <Input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={workpaperUrl}
                      onChange={(e) => setWorkpaperUrl(e.target.value)}
                    />
                    <p className="text-[11px] text-violet-600">Wajib diisi bila area ini memiliki kertas kerja.</p>
                  </div>
                </div>

                {selectedArea && selectedAreaRequirement && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">Kriteria wajib untuk area ini</p>
                    <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 mb-2">Dokumen</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedAreaRequirement.requiredDocs.map((doc) => (
                            <Badge key={doc} variant="secondary" className="bg-white text-slate-700 border border-slate-200">
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-violet-700 mb-2">Kertas Kerja</p>
                        <div className="flex flex-wrap gap-2">
                          {(selectedAreaRequirement.workpapers ?? workpaperListForSelectedArea).length === 0 ? (
                            <Badge variant="secondary" className="bg-white text-slate-500 border border-slate-200">
                              Tidak ada kertas kerja khusus
                            </Badge>
                          ) : (
                            (selectedAreaRequirement.workpapers ?? workpaperListForSelectedArea).map((paper) => (
                              <Badge key={paper} variant="secondary" className="bg-violet-100 text-violet-800 border border-violet-200">
                                {paper}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Catatan Tambahan</Label>
                  <Textarea
                    rows={3}
                    placeholder="Catatan tambahan..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setSelectedArea(""); setSelectedDoc(""); setSelectedWorkpaper(""); setFileUrl(""); setWorkpaperUrl(""); setNote(""); setStatus("TERPENUHI"); }}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={saving === "form"}>
                  {saving === "form" ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Simpan Data</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="daftar" className="mt-0">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" />
                Daftar Dokumen {currentOpdName ? `— ${currentOpdName}` : ""}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Total {submissions.length} (terfilter: {filteredSubmissions.length})
              </CardDescription>
            </CardHeader>
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Cari dokumen / OPD..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={String(filterArea)}
                  onValueChange={(v) => setFilterArea(v === "all" ? "all" : Number(v))}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Semua Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Area</SelectItem>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.areaName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterStatus}
                  onValueChange={(v) => setFilterStatus(v as "all" | DocStatus)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="TERPENUHI">Terpenuhi</SelectItem>
                    <SelectItem value="BELUM_TERPENUHI">Belum Terpenuhi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardContent className="p-0">
              {filteredSubmissions.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold">Tidak ada data</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {areas.map((area) => {
                    const areaSubs = filteredSubmissions.filter((s) => s.areaId === area.id);
                    if (areaSubs.length === 0) return null;
                    const isExpanded = expandedAreas[area.id] ?? true;
                    const terpenuhi = areaSubs.filter((s) => s.status === "TERPENUHI").length;
                    const persentase = (terpenuhi / areaSubs.length) * 100;
                    return (
                      <div key={area.id} className="border-b border-slate-100 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => toggleArea(area.id)}
                          className="w-full px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4 bg-slate-50/60 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Folder
                              className={cn(
                                "w-5 h-5 shrink-0",
                                persentase >= 80 ? "text-emerald-600" :
                                persentase >= 40 ? "text-amber-600" : "text-rose-600"
                              )}
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-800 truncate">
                                Area {area.id}: {area.areaName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {terpenuhi} / {areaSubs.length} — {persentase.toFixed(0)}%
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader className="bg-slate-50">
                                <TableRow>
                                  <TableHead className="w-12 text-center text-xs">#</TableHead>
                                  <TableHead className="text-xs">Nama Dokumen</TableHead>
                                  {user.role === "ADMIN_UTAMA" && (
                                    <TableHead className="text-xs">OPD</TableHead>
                                  )}
                                  <TableHead className="w-40 text-center text-xs">Status</TableHead>
                                  <TableHead className="w-40 text-center text-xs">Aksi</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {areaSubs.map((s, idx) => (
                                  <TableRow key={s.id}>
                                    <TableCell className="text-center text-xs font-bold text-slate-500">{idx + 1}</TableCell>
                                    <TableCell className="text-sm">
                                      <div className="font-semibold">{s.documentName}</div>
                                      {s.note && (
                                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                          Catatan: {s.note}
                                        </div>
                                      )}
                                      {s.fileUrl && (
                                        <a
                                          href={s.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[11px] text-indigo-600 hover:text-indigo-700 underline font-medium inline-flex items-center mt-0.5"
                                        >
                                          Lihat File ↗
                                        </a>
                                      )}
                                      {s.workpaperUrl && (
                                        <a
                                          href={s.workpaperUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[11px] text-violet-600 hover:text-violet-700 underline font-medium inline-flex items-center mt-0.5 ml-3"
                                        >
                                          Lihat Kertas Kerja ↗
                                        </a>
                                      )}
                                    </TableCell>
                                    {user.role === "ADMIN_UTAMA" && (
                                      <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">{s.opdName}</TableCell>
                                    )}
                                    <TableCell className="text-center">
                                      <Badge
                                        variant={s.status === "TERPENUHI" ? "success" : "secondary"}
                                        className={cn(
                                          "text-[11px] font-semibold",
                                          s.status === "TERPENUHI" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                                        )}
                                      >
                                        {s.status === "TERPENUHI" ? "✓ Terpenuhi" : "○ Belum"}
                                      </Badge>
                                      <div className="mt-1 text-[10px] text-slate-500">
                                        {s.verificationStatus === "DIVERIFIKASI" ? "Diverifikasi" : s.verificationStatus === "PERLU_REVISI" ? "Perlu revisi" : s.verificationStatus === "DITOLAK" ? "Ditolak" : "Belum diverifikasi"}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        {user.role === "ADMIN_UTAMA" && (s.fileUrl || s.workpaperUrl) && (
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs gap-1"
                                            onClick={() => handleVerification(s, "DIVERIFIKASI")}
                                            disabled={saving === `verify-${s.id}`}
                                          >
                                            {saving === `verify-${s.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                                            Verifikasi
                                          </Button>
                                        )}
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="h-8 text-xs gap-1"
                                          onClick={() => handleQuickUpdate(s, "TERPENUHI")}
                                          disabled={saving === s.id}
                                        >
                                          {saving === s.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          )}
                                          Valid
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 text-xs gap-1 text-slate-600"
                                          onClick={() => handleQuickUpdate(s, "BELUM_TERPENUHI")}
                                          disabled={saving === s.id}
                                        >
                                          <Circle className="w-3.5 h-3.5" /> Reset
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
