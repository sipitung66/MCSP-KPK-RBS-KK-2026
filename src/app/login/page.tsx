"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { login, type LoginFormState } from "@/lib/actions/auth.actions";

const initialState: LoginFormState = {};

export default function LoginPage() {
  const [state, formAction] = useFormState(login, initialState);
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "Login Berhasil",
        description: "Selamat datang di sistem MCSP KPK.",
        variant: "default",
      });
      router.push("/dashboard");
      router.refresh();
    } else if (state?.error) {
      toast({
        title: "Login Gagal",
        description: state.error,
        variant: "destructive",
      });
    }
  }, [state, router, toast]);

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-gov shadow-xl mb-4">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-sm font-bold tracking-widest text-indigo-700 uppercase mb-2">
            Inspektorat Daerah
          </h2>
          <h1 className="text-xl font-extrabold text-slate-800 leading-tight">
            Kabupaten Konawe
          </h1>
        </div>

        <Card className="w-full shadow-2xl border-0 overflow-hidden">
          <div className="h-1.5 gradient-gov" />
          <CardHeader className="space-y-2 pb-6 pt-8">
            <CardTitle className="text-2xl font-bold text-center gradient-gov-text leading-tight">
              Aplikasi Monitoring &amp; Pemenuhan Dokumen
            </CardTitle>
            <CardDescription className="text-center text-base text-slate-600 font-medium">
              MCSP KPK - Sistem Pelaporan Berbasis Data untuk Pencegahan Korupsi
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={formAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Alamat Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nama.opd@konawekab.go.id"
                    className="pl-10 h-11 text-base border-slate-200 focus-visible:ring-indigo-500"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Kata Sandi
                  </Label>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 opacity-60 cursor-not-allowed"
                  >
                    Lupa kata sandi?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata sandi"
                    className="pl-10 pr-11 h-11 text-base border-slate-200 focus-visible:ring-indigo-500"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold gradient-gov shadow-lg hover:shadow-xl hover:opacity-95 transition-all"
              >
                Masuk ke Sistem
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col space-y-3 border-t border-slate-100 bg-slate-50/50 p-6">
            <div className="w-full">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-indigo-500" />
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                  Kredensial Demo
                </p>
              </div>
              <div className="space-y-2.5">
                <div className="rounded-lg border border-indigo-100 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default" className="text-[10px] px-2 py-0 font-bold">
                      ADMIN UTAMA
                    </Badge>
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                      {getInitials("admin.mcsp@konawekab.go.id")}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-700">
                    admin.mcsp@konawekab.go.id
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    AdminMCSP@Konawe2026!
                  </p>
                </div>

                <div className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="success" className="text-[10px] px-2 py-0 font-bold">
                      ADMIN OPD
                    </Badge>
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                      {getInitials("admin.bkpsdm@konawekab.go.id")}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-700">
                    admin.bkpsdm@konawekab.go.id
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    AdminOPD@123
                  </p>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Inspektorat Daerah Kabupaten Konawe.
            <br />
            MCSP KPK - Monitoring dan Pengendalian Pencegahan Korupsi
          </p>
        </div>
      </div>
    </div>
  );
}
