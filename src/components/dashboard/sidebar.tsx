"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  Brain,
  LayoutDashboard,
  ScrollText,
  Trophy,
  Settings,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  sidebarOpen?: boolean;
  onToggle?: () => void;
}

const sidebarLinks = [
  {
    group: "Workspace",
    links: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/trading", label: "Trading Lens", icon: Brain, badge: "LIVE" },
      { href: "/dashboard/charts", label: "Chart Lens", icon: TrendingUp },
      { href: "/dashboard/learn", label: "Edu Lens", icon: BookOpen },
    ],
  },
  {
    group: "Performance",
    links: [
      { href: "/dashboard/journal", label: "Journal", icon: ScrollText },
      { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    group: "Account",
    links: [
      { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function DashboardSidebar({ user, sidebarOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#020610]/60 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.06] bg-[#050a18] transition-all duration-300",
          collapsed ? "w-[72px]" : "w-[264px]",
          "-translate-x-full lg:translate-x-0",
          sidebarOpen && "translate-x-0"
        )}
      >
        {/* hairline top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

        {/* Logo */}
        <div className="flex h-[64px] items-center justify-between gap-2 border-b border-white/[0.06] px-3 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <img
              src="/logo.png"
              alt="TradingLens AI"
              className={cn(
                "w-auto object-contain shrink-0 logo-enhance",
                collapsed ? "h-7" : "h-8"
              )}
            />
            {!collapsed && (
              <span className="flex flex-col leading-none">
                <span className="font-display text-[13px] font-bold tracking-tight text-white">
                  TRADINGLENS<span className="font-light text-primary"> AI</span>
                </span>
                <span className="text-[9px] tracking-[0.22em] text-white/35 font-medium -mt-0.5">
                  TRADING COCKPIT
                </span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:border-white/15 transition-colors shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Live pulse strip when expanded */}
        {!collapsed && (
          <div className="mx-3 mt-3 flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-bold tracking-[0.14em] text-emerald-300">MARKET OPEN</span>
            <span className="ml-auto text-[10px] text-white/35">16 pairs • LIVE</span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6 scrollbar-thin">
          {sidebarLinks.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <p className="px-2.5 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/25">
                  {group.group}
                </p>
              )}
              <div className="space-y-1">
                {group.links.map((link) => {
                  const isActive =
                    link.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname?.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => onToggle?.()}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-full px-3 py-2.5 text-[13px] font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(242,193,78,0.25)]"
                          : "text-white/55 hover:text-white hover:bg-white/[0.06]",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <link.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "" : "group-hover:text-white")} />
                      {!collapsed && (
                        <>
                          <span className="whitespace-nowrap">{link.label}</span>
                          {/* @ts-ignore */}
                          {link.badge && !isActive && (
                            <span className="ml-auto rounded-full bg-emerald-400/15 border border-emerald-400/20 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-emerald-300">
                              {(link as any).badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {!collapsed && (
            <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-white/[0.02] to-transparent p-4">
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-primary">
                <Sparkles className="h-3.5 w-3.5" /> PRO PLAN
              </div>
              <p className="mt-2 text-sm font-semibold text-white leading-5">Unlock live AI analysis</p>
              <p className="mt-1 text-xs leading-5 text-white/45">Unlimited chart intel, full EduLens, and funded challenges.</p>
              <Link
                href="/dashboard/subscription"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#050a18] hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                View plans <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-white/30">
                <ShieldCheck className="h-3 w-3" /> Secure • Cancel anytime
              </p>
            </div>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.06] p-2.5 shrink-0">
          <div className={cn("flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2", collapsed && "justify-center")}>
            <div className="relative h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-primary to-[#d4a017] flex items-center justify-center text-primary-foreground text-xs font-bold ring-2 ring-primary/20">
              {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
              <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#050a18]" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate leading-none">{user?.name || "Trader"}</p>
                <p className="text-[11px] text-white/40 truncate">{user?.email || ""}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className={cn(
              "flex w-full items-center gap-2 rounded-full px-3 py-2.5 text-xs font-medium text-white/40 hover:text-red-300 hover:bg-red-500/10 transition-colors mt-2",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
