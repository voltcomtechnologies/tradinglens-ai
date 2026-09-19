import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardTopBar } from "./top-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <div className="min-h-screen bg-[#050a18] text-foreground">
      {/* ambient stage */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute inset-0 bg-grid opacity-[0.12]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_18%_12%,rgba(242,193,78,0.07),transparent_45%),radial-gradient(55%_50%_at_92%_18%,rgba(92,225,255,0.05),transparent_42%),radial-gradient(70%_45%_at_50%_100%,rgba(124,140,255,0.05),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050a18] via-transparent to-[#050a18]/40" />
      </div>

      <DashboardTopBar />

      <div className="relative lg:pl-[264px] transition-all duration-300">
        {/* desktop command bar */}
        <div className="hidden lg:flex sticky top-0 z-20 h-[64px] items-center justify-between gap-6 border-b border-white/[0.06] bg-[#050a18]/70 backdrop-blur-2xl px-6">
          <div className="flex flex-1 max-w-xl items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5">
            <svg
              className="h-4 w-4 text-white/30 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search trades, courses, charts…  (⌘K)"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
            <span className="hidden sm:inline-flex rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold tracking-widest text-white/40">
              ⌘ K
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold tracking-[0.14em] text-white/50">MARKET OPEN • LIVE FEED</span>
            </div>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors" aria-label="Notifications">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-[#050a18]" />
            </button>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8 pb-12">{children}</main>
      </div>
    </div>
  );
}
