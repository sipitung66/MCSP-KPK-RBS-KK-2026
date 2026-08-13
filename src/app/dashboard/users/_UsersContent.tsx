"use client";

import { useState } from "react";
import {
  Users,
  Search,
  UserPlus,
  Trash2,
  Mail,
  Shield,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import type { OPDList } from "@prisma/client";
import { getAllUsers, createUserOPD, deleteUser } from "@/lib/actions/users.actions";
import type { PublicUser } from "@/lib/actions/users.actions";

interface UsersContentProps {
  opds: OPDList[];
  initialUsers: PublicUser[];
}

export function UsersContent({ opds, initialUsers }: UsersContentProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "ADMIN_UTAMA" | "ADMIN_OPD">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newOpd, setNewOpd] = useState("");

  const loadData = async () => {
    const data = await getAllUsers();
    setUsers(data);
  };

  const filteredUsers = users.filter((u) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const emailMatch = u.email.toLowerCase().includes(term);
      const opdMatch = u.opdName?.toLowerCase().includes(term) ?? false;
      if (!emailMatch && !opdMatch) return false;
    }
    if (filterRole !== "all" && u.role !== filterRole) return false;
    return true;
  });

  const stats = {
    total: users.length,
    adminUtama: users.filter((u) => u.role === "ADMIN_UTAMA").length,
    adminOPD: users.filter((u) => u.role === "ADMIN_OPD").length,
    opdWithoutUser: opds.filter(
      (o) => !users.some((u) => u.opdName === o.opdName && u.role === "ADMIN_OPD")
    ).length,
  };

  const resetForm = () => {
    setNewEmail("");
    setNewPassword("");
    setNewOpd("");
    setShowPassword(false);
  };

  const handleCreate = async () => {
    if (!newEmail || !newPassword || !newOpd) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Email, password, dan OPD harus diisi.",
        variant: "destructive",
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast({
        title: "Format Email Salah",
        description: "Masukkan alamat email yang valid.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password Terlalu Pendek",
        description: "Password minimal 6 karakter.",
        variant: "destructive",
      });
      return;
    }
    setCreating(true);
    try {
      const result = await createUserOPD(newEmail, newPassword, newOpd);
      if (result.success) {
        toast({
          title: "User Berhasil Dibuat",
          description: `Akun ${newEmail} berhasil didaftarkan.`,
        });
        resetForm();
        setDialogOpen(false);
        await loadData();
      } else {
        toast({
          title: "Gagal Membuat User",
          description: result.error ?? "Terjadi kesalahan.",
          variant: "destructive",
        });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Yakin hapus user ${email}?`)) return;
    setDeletingId(userId);
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        toast({
          title: "User Dihapus",
          description: `Akun ${email} berhasil dihapus.`,
        });
        await loadData();
      } else {
        toast({
          title: "Gagal Menghapus",
          description: result.error ?? "Terjadi kesalahan.",
          variant: "destructive",
        });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewPassword(pass);
    setShowPassword(true);
  };

  const getRoleVariant = (role: string): "default" | "success" | "secondary" => {
    return role === "ADMIN_UTAMA" ? "default" : role === "ADMIN_OPD" ? "success" : "secondary";
  };
  const getRoleLabel = (role: string) =>
    role === "ADMIN_UTAMA" ? "Admin Utama" : "Admin OPD";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1">Total User</p>
                <p className="text-3xl font-extrabold text-indigo-800 mt-2">{stats.total}</p>
                <p className="text-xs text-indigo-600 mt-1">Akun terdaftar</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-1">Admin Utama</p>
                <p className="text-3xl font-extrabold text-violet-800 mt-2">{stats.adminUtama}</p>
                <p className="text-xs text-violet-600 mt-1">Hak akses penuh</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-violet-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Admin OPD</p>
                <p className="text-3xl font-extrabold text-emerald-800 mt-2">{stats.adminOPD}</p>
                <p className="text-xs text-emerald-600 mt-1">Pengelola per OPD</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
          stats.opdWithoutUser > 0 && "ring-2 ring-amber-400"
        )}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">OPD Tanpa User</p>
                <p className={cn(
                  "text-3xl font-extrabold mt-2",
                  stats.opdWithoutUser > 0 ? "text-amber-800" : "text-emerald-700"
                )}>{stats.opdWithoutUser}</p>
                <p className="text-xs text-amber-600 mt-1">
                  {stats.opdWithoutUser > 0 ? "Perlu dibuatkan akun" : "Semua OPD punya akun"}
                </p>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                stats.opdWithoutUser > 0 ? "bg-amber-100" : "bg-emerald-100"
              )}>
                {stats.opdWithoutUser > 0 ? (
                  <AlertTriangle className="w-6 h-6 text-amber-700" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari email / nama OPD..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={filterRole}
            onValueChange={(v) => setFilterRole(v as typeof filterRole)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              <SelectItem value="ADMIN_UTAMA">Admin Utama</SelectItem>
              <SelectItem value="ADMIN_OPD">Admin OPD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" className="gap-2">
              <UserPlus className="w-4 h-4" />
              Tambah User OPD
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Tambah Akun Admin OPD
              </DialogTitle>
              <DialogDescription>
                Buat akun baru untuk Admin OPD agar dapat mengunggah dokumen.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Email <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="admin.opd@konawekab.go.id"
                    className="pl-9"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Password <span className="text-rose-500">*</span></Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-indigo-600 px-2"
                    onClick={generatePassword}
                  >
                    🎲 Generate
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    className="pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">OPD <span className="text-rose-500">*</span></Label>
                <Select value={newOpd} onValueChange={setNewOpd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih OPD..." />
                  </SelectTrigger>
                  <SelectContent>
                    {opds.map((o) => {
                      const hasUser = users.some(
                        (u) => u.opdName === o.opdName && u.role === "ADMIN_OPD"
                      );
                      return (
                        <SelectItem
                          key={o.id}
                          value={o.opdName}
                          disabled={hasUser}
                          className={hasUser ? "opacity-50" : ""}
                        >
                          <div className="flex items-center justify-between gap-3 w-full pr-2">
                            <span>{o.opdName}</span>
                            {hasUser && (
                              <Badge variant="secondary" className="text-[10px] ml-2">Sudah Ada</Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {stats.opdWithoutUser > 0 && (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    Tersisa {stats.opdWithoutUser} OPD yang belum memiliki Admin OPD
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDialogOpen(false); resetForm(); }}
              >
                Batal
              </Button>
              <Button type="button" onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Simpan User</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">Tidak ada user ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-14 text-center font-bold">#</TableHead>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="font-bold">Role</TableHead>
                    <TableHead className="font-bold">OPD</TableHead>
                    <TableHead className="w-40 font-bold">Dibuat</TableHead>
                    <TableHead className="w-24 text-center font-bold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u, idx) => (
                    <TableRow key={u.id}>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {u.email
                              .split("@")[0]
                              .split(/[._-]/)
                              .map((n) => n[0]?.toUpperCase() ?? "")
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{u.email}</p>
                            <p className="text-[11px] text-slate-500">ID: {u.id.slice(0, 12)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getRoleVariant(u.role)}
                          className={cn(
                            "text-[11px] font-semibold px-2.5 py-1",
                            u.role === "ADMIN_UTAMA" && "bg-indigo-100 text-indigo-800",
                            u.role === "ADMIN_OPD" && "bg-emerald-100 text-emerald-800"
                          )}
                        >
                          {u.role === "ADMIN_UTAMA" ? (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" /> {getRoleLabel(u.role)}
                            </span>
                          ) : getRoleLabel(u.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700 max-w-[280px]">
                        {u.opdName ? (
                          <div className="flex items-start gap-2">
                            <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <span>{u.opdName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">— (Semua OPD) —</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        {u.role === "ADMIN_UTAMA" ? (
                          <span className="text-[11px] text-slate-400 italic">Dilindungi</span>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel className="text-xs text-slate-500">Tindakan</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-rose-600 focus:bg-rose-50 cursor-pointer"
                                onClick={() => handleDelete(u.id, u.email)}
                                disabled={deletingId === u.id}
                              >
                                {deletingId === u.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Hapus User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
