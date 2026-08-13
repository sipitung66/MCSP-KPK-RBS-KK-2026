"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, LogOut, Moon, Sun, User as UserIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { logout } from "@/lib/actions/auth.actions";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

interface HeaderProps {
  title: string;
  subtitle?: string;
  user?: CurrentUser;
}

function getInitials(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function getRoleLabel(role: UserRole): string {
  return role === "ADMIN_UTAMA" ? "Admin Utama" : "Admin OPD";
}

function getRoleBadgeVariant(role: UserRole): "default" | "success" {
  return role === "ADMIN_UTAMA" ? "default" : "success";
}

function buildBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [];
  const segments = pathname.split("/").filter(Boolean);

  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    areas: "Rekap Per Area",
    opds: "Rekap Per OPD",
    ews: "Early Warning",
    users: "Kelola User OPD",
    submissions: "Unggah Dokumen",
    progress: "Progres Saya",
  };

  let href = "";
  segments.forEach((seg, idx) => {
    href += "/" + seg;
    const label = labelMap[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
    crumbs.push({
      label,
      href: idx === segments.length - 1 ? undefined : href,
    });
  });

  return crumbs;
}

export function Header({ title, subtitle, user }: HeaderProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) setIsDark(true);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.toggle("dark");
    setIsDark(!isDark);
  };

  const breadcrumbs = buildBreadcrumbs(pathname ?? "");

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        <div className="flex flex-col justify-center min-w-0 pt-14 lg:pt-0">
          <div className="hidden lg:flex items-center text-xs text-slate-500 gap-1.5 mb-0.5">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
                <span
                  className={cn(
                    "font-medium",
                    crumb.href ? "text-slate-500 hover:text-indigo-600" : "text-slate-700"
                  )}
                >
                  {crumb.label}
                </span>
              </div>
            ))}
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 truncate leading-tight mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pt-14 lg:pt-0">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
            onClick={toggleTheme}
            title="Toggle Tema"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 h-10 px-2 sm:px-3 hover:bg-slate-100 data-[state=open]:bg-slate-100"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-sm font-bold flex items-center justify-center shadow-sm shrink-0">
                    {getInitials(user.email)}
                  </div>
                  <div className="hidden sm:flex flex-col items-start min-w-0">
                    <span className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">
                      {user.opdName ?? "Admin Utama"}
                    </span>
                    <Badge
                      variant={getRoleBadgeVariant(user.role)}
                      className="text-[10px] px-1.5 py-0 h-4 mt-0.5"
                    >
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 rounded-xl shadow-xl border-slate-200"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-base font-bold flex items-center justify-center shadow-md">
                      {getInitials(user.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {user.opdName ?? "Admin Utama"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        className="mt-1 text-[10px] px-2 py-0"
                      >
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer focus:bg-slate-50 py-2.5 text-slate-700">
                    <UserIcon className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="text-sm">Profil Saya</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <form action={logout} className="w-full">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md text-rose-600 hover:bg-rose-50 focus:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 ml-1" />
                    <span className="font-medium">Keluar Sistem</span>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
