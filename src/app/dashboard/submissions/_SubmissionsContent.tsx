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
import { getSubmissionsByOPD, upsertSubmission } from "@/lib/actions/submissions.actions";
import type { MCSPArea, OPDList, Submission, DocStatus } from "@prisma/client";

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
}

export function SubmissionsContent({ user, areas, opds, initialSubmissions }: SubmissionsContentProps) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState<number | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | DocStatus>("all");
  const [activeTab, setActiveTab] = useState<string>("unggah");
  const [selectedArea, setSelectedArea] = useState<number | "">("");
  const [selectedDoc, setSelectedDoc] = useState<string>("");
  const [status, setStatus] = useState<DocStatus>("TERPENUHI");
  const [fileUrl, setFileUrl] = useState("");
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
        : undefined
      : user.opdName ?? undefined;

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
    if (!selectedArea || !selectedDoc) {
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
    setSaving("form");
    try {
      const result = await upsertSubmission(
        targetOpd,
        Number(selectedArea),
        selectedDoc,
        status,
        fileUrl || undefined,
        note || undefined
      );
      if (result.success) {
        toast({
          title: "Berhasil Disimpan",
          description: `Data "${selectedDoc}" berhasil diperbarui.`,
        });
        setSelectedDoc(""); setFileUrl(""); setNote(""); setStatus("TERPENUHI");
        await refreshSubmissions();
      } else {
        toast({
          title: "Gagal Menyimpan",
          description: result.error ?? "Terjadi kesalahan.",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(null);
    }
  };

  const handleQuickUpdate = async (sub: Submission, newStatus: DocStatus) => {
    setSaving(sub.id);
    try {
      const result = await upsertSubmission(
        sub.opdName, sub.areaId, sub.documentName,
        newStatus, sub.fileUrl ?? undefined, sub.note ?? undefined
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

  const filteredSubmissions = submissions.filter((s) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!s.documentName.toLowerCase().includes(term) && !s.opdName.toLowerCase().includes(term)) return false;
    }
    if (filterArea !== "all" && s.areaId !== Number(filterArea)) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const documentListForSelectedArea = selectedArea ? AREA_DOCUMENTS[Number(selectedArea)] ?? [] : [];

  return (
    <div className="space-y-6">
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
                      onValueChange={(v) => { setSelectedArea(Number(v)); setSelectedDoc(""); }}
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
                    <Label className="text-sm font-semibold">
                      Nama Dokumen <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={selectedDoc}
                      onValueChange={setSelectedDoc}
                      disabled={!selectedArea}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedArea ? "Pilih dokumen..." : "Pilih Area dulu"} />
                      </SelectTrigger>
                      <SelectContent>
                        {documentListForSelectedArea.map((doc, idx) => (
                          <SelectItem key={idx} value={doc}>{doc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Label className="text-sm font-semibold">URL File Dokumen</Label>
                    <Input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                    />
                  </div>
                </div>
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
                  onClick={() => { setSelectedArea(""); setSelectedDoc(""); setFileUrl(""); setNote(""); setStatus("TERPENUHI"); }}
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
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex items-center justify-center gap-1.5">
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
