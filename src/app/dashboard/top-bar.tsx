"use client";

import { useState, useEffect } from "react";
import { Menu, X, Search, Bell } from "lucide-react";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useSession } from "next-auth/react";

export function DashboardTopBar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const handleRouteChange = () => setSidebarOpen(false);
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  return (
    <>
      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={{
          name: session?.user?.name,
          email: session?.user?.email,
          image: session?.user?.image,
        }}
      />

      <div className="lg:hidden fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#050a18]/80 backdrop-blur-2xl px-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1] transition-colors"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="TradingLens AI" className="h-7 w-auto object-contain logo-enhance" />
            <span className="hidden xs:flex flex-col leading-none">
              <span className="font-display text-[11px] font-bold text-white">TRADINGLENS AI</span>
              <span className="text-[8px] tracking-[0.18em] text-white/35">COCKPIT</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50" aria-label="Search">
            <Search className="h-4 w-4" />
          </button>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-[#050a18]" />
          </button>
        </div>
      </div>
      {/* spacer for fixed mobile bar */}
      <div className="lg:hidden h-14" aria-hidden />
    </>
  );
}
