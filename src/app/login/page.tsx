"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

  return (
    <main className="login-page min-h-screen w-full overflow-hidden bg-[#061f3d] text-slate-900">
      <div className="login-layout mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="login-hero relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col lg:justify-end lg:px-16 lg:pb-10 lg:pt-16">
          <div className="login-hero-photo absolute inset-0" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#031a35] via-[#062750]/20 to-[#041d3c]/20" />
          <div className="relative z-10 max-w-[520px] pb-2 text-white">
            <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-white/80 uppercase">Inspektorat Kabupaten Konawe</p>
            <h1 className="max-w-[500px] text-base font-semibold leading-[1.35] tracking-normal text-white/95 xl:text-lg">&quot;Korupsi Menghancurkan Tatanan Bangsa. Pemerintah Kabupaten Konawe Berkomitmen Penuh: Tolak, Cegah, dan Lawan Korupsi demi Konawe yang Berintegritas!&quot;</h1>
            <div className="mt-3 h-0.5 w-10 bg-[#ffd500]" />
          </div>
        </section>

        <section className="flex min-h-screen flex-col items-center justify-center bg-[#f1f2f4] px-5 py-10 sm:px-10">
          <div className="w-full max-w-[410px]">
            <div className="mb-7 text-center">
              <div className="mb-5 flex items-center justify-center gap-5" aria-label="Logo KPK dan Kabupaten Konawe">
                <Image src="/logos/kpk clean.png" alt="Logo KPK" width={48} height={54} className="h-[54px] w-auto object-contain" priority />
                <Image src="/logos/konawe clean.png" alt="Logo Kabupaten Konawe" width={48} height={54} className="h-[54px] w-auto object-contain" priority />
              </div>
              <Image src="/logos/Logo MCSP KPK RBS.jpg" alt="Logo MCSP KPK RBS" width={112} height={58} className="mx-auto mb-5 h-[58px] w-28 object-contain" priority />
              <h2 className="text-[25px] font-bold tracking-tight text-[#092b4d]">MCP KPK</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Inspektorat Kabupaten Konawe</p>
              <div className="mx-auto mt-3 h-1 w-14 bg-[#f4cf00]" />
            </div>

          <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-semibold text-slate-600">Username atau Email</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Masukkan username"
                    className="h-10 rounded-xl border-slate-300 bg-white pl-9 text-xs shadow-none focus-visible:ring-[#0a477c]"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[11px] font-semibold text-slate-600">Password</Label>
                </div>
                <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      className="h-10 rounded-xl border-slate-300 bg-white pl-9 pr-10 text-xs shadow-none focus-visible:ring-[#0a477c]"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
              </div>

              <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-500">
                <label className="flex items-center gap-1.5"><input type="checkbox" className="h-3 w-3 rounded border-slate-300 accent-[#07518c]" />Ingat Saya</label>
                <span className="font-bold text-[#07518c]">Lupa Password?</span>
              </div>
              <Button type="submit" className="h-10 w-full rounded-xl bg-[#06477f] text-xs font-bold shadow-md transition-colors hover:bg-[#05375f]">Masuk <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </form>
            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400"><LockKeyhole className="h-3 w-3" />Sistem Terenkripsi &amp; Terawasi</div>
          </div>
          <footer className="mt-auto pt-10 text-center text-[9px] leading-5 text-slate-400">
            <p>&copy; 2024 Inspektorat Kabupaten Konawe. All Rights Reserved.</p>
            <p>Privacy Policy <span className="mx-2">•</span> Terms of Service <span className="mx-2">•</span> Help Desk</p>
          </footer>
        </section>
      </div>
    </main>
  );
}
