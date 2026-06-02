"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
    group: "Main",
    links: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/trading", label: "Trading Lens", icon: Brain },
      { href: "/dashboard/charts", label: "Chart Lens", icon: TrendingUp },
      { href: "/dashboard/learn", label: "Edu Lens", icon: BookOpen },
    ],
  },
  {
    group: "Trading",
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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          "-translate-x-full lg:translate-x-0",
          sidebarOpen && "translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 group overflow-hidden">
            <img
              src="/logo.png"
              alt="TradingLens AI"
              className={cn(
                "w-auto object-contain shrink-0 transition-all",
                collapsed ? "h-6" : "h-8"
              )}
            />
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0 p-1.5 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {sidebarLinks.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
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
                        "relative flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 bg-primary/10 rounded-lg"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <link.icon className="relative h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <span className="relative whitespace-nowrap">{link.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border shrink-0">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0] || user?.email?.[0] || "U"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
              </div>
            )}
          </div>
          <form action="/api/auth/signout" method="POST" className="mt-2">
            <button
              type="submit"
              className={cn(
                "flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
                collapsed && "justify-center"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
