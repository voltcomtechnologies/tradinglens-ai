"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useSession } from "next-auth/react";

export function DashboardTopBar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  // Close sidebar on route change
  useEffect(() => {
    const handleRouteChange = () => setSidebarOpen(false);
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  return (
    <>
      {/* Mobile sidebar */}
      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={{
          name: session?.user?.name,
          email: session?.user?.email,
          image: session?.user?.image,
        }}
      />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 h-14 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <span className="text-[10px] font-bold text-white">T</span>
            </div>
            <span className="text-sm font-bold gradient-text">TradingLens</span>
          </Link>
        </div>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>
      </div>
    </>
  );
}
