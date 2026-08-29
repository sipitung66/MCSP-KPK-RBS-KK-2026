"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  LayoutDashboard,
  PieChart,
  Building2,
  AlertTriangle,
  Users,
  Tags,
  Upload,
  TrendingUp,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions/auth.actions";
import type { CurrentUser } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

interface SidebarProps {
  user: CurrentUser;
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const navItemsAdminUtama: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Rekap Per Area", href: "/dashboard/areas", icon: PieChart },
  { label: "Rekap Per OPD", href: "/dashboard/opds", icon: Building2 },
  { label: "Early Warning", href: "/dashboard/ews", icon: AlertTriangle },
  { label: "Asesmen Risiko", href: "/dashboard/risk", icon: ShieldCheck },
  { label: "Kelola User OPD", href: "/dashboard/users", icon: Users },
  { label: "Kelola Tagging OPD", href: "/dashboard/tagging", icon: Tags },
];

const navItemsAdminOPD: NavItem[] = [
  { label: "Dashboard OPD", href: "/dashboard", icon: LayoutDashboard },
  { label: "Unggah Dokumen", href: "/dashboard/submissions", icon: Upload },
  { label: "Progres Saya", href: "/dashboard/progress", icon: TrendingUp },
];

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

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems =
    user.role === "ADMIN_UTAMA" ? navItemsAdminUtama : navItemsAdminOPD;

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/60">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-gov shadow-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-extrabold text-sm tracking-wider leading-tight">
            MCSP KONAWE
          </span>
          <span className="text-amber-300 text-[10px] font-semibold tracking-widest">
            2026 EDITION
          </span>
        </div>
        <button
          className="ml-auto lg:hidden text-slate-400 hover:text-white"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Menu Navigasi
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-lg shadow-teal-950/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-colors",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-teal-300"
                )}
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
              )}
            </Link>
          );
        })}
      </nav>

    </div>
  );

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center px-4">
        <button
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="ml-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-gov flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-sm">MCSP KONAWE</span>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-100 shadow-2xl transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {SidebarContent}
      </aside>
    </>
  );
}
