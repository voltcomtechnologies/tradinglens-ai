"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Brain,
  Clock,
  Crown,
  DollarSign,
  Flame,
  Layers,
  Loader2,
  ScrollText,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useJournalStats } from "@/lib/hooks/use-journal";

interface DashboardOverviewProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

/* ——— quick lenses: each gets its own saturated identity ——— */
const quickActions = [
  {
    title: "Trading Lens",
    desc: "Live AI signals — every call explained",
    href: "/dashboard/trading",
    icon: Brain,
    grad: "from-amber-400 via-[#f2c14e] to-orange-400",
    soft: "from-amber-400/16 via-primary/8 to-transparent",
    ring: "border-amber-400/20",
    iconWrap: "bg-white text-amber-500 shadow-[0_8px_20px_rgba(242,193,78,0.35)]",
    dot: "bg-amber-400",
  },
  {
    title: "Chart Lens",
    desc: "16 pairs • real-time candles + AI overlays",
    href: "/dashboard/charts",
    icon: BarChart3,
    grad: "from-cyan-400 via-sky-400 to-blue-500",
    soft: "from-cyan-400/14 via-sky-400/8 to-transparent",
    ring: "border-cyan-400/20",
    iconWrap: "bg-white text-cyan-500 shadow-[0_8px_20px_rgba(6,182,212,0.32)]",
    dot: "bg-cyan-400",
  },
  {
    title: "Edu Lens",
    desc: "Courses, PDFs & adaptive quizzes",
    href: "/dashboard/learn",
    icon: BookOpen,
    grad: "from-violet-400 via-fuchsia-400 to-indigo-500",
    soft: "from-violet-400/14 via-fuchsia-400/8 to-transparent",
    ring: "border-violet-400/20",
    iconWrap: "bg-white text-violet-500 shadow-[0_8px_20px_rgba(139,92,246,0.32)]",
    dot: "bg-violet-400",
  },
  {
    title: "Trading Journal",
    desc: "Log, review & compound every trade",
    href: "/dashboard/journal",
    icon: ScrollText,
    grad: "from-emerald-400 via-teal-400 to-cyan-400",
    soft: "from-emerald-400/14 via-teal-400/8 to-transparent",
    ring: "border-emerald-400/20",
    iconWrap: "bg-white text-emerald-500 shadow-[0_8px_20px_rgba(16,185,129,0.32)]",
    dot: "bg-emerald-400",
  },
];

export function DashboardOverview({ user }: DashboardOverviewProps) {
  const { data: stats, isLoading: loading } = useJournalStats();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = (user.name || "Trader").split(" ")[0];
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // ——— colourful stat mosaic ———
  const tiles = [
    {
      label: "Total Trades",
      value: loading ? "…" : String(stats?.total ?? 0),
      meta: stats?.total ? `${stats.closed ?? 0} closed • ${stats.open ?? 0} open` : "Start your first trade",
      icon: Layers,
      // cyan / sky
      bg: "from-cyan-500/18 via-sky-500/10 to-transparent",
      border: "border-cyan-400/20",
      glow: "shadow-[0_12px_40px_rgba(6,182,212,0.18)]",
      iconBg: "bg-cyan-400/14 border-cyan-400/20 text-cyan-200",
      orb: "bg-cyan-400/22",
      accent: "bg-cyan-400",
    },
    {
      label: "Win Rate",
      value: loading ? "…" : `${(stats?.winRate ?? 0).toFixed(0)}%`,
      meta: stats?.winRate ? `${stats.winning} wins • ${stats.losing} losses` : "No closed trades yet",
      icon: Target,
      // emerald / teal
      bg: "from-emerald-500/18 via-teal-500/10 to-transparent",
      border: "border-emerald-400/20",
      glow: "shadow-[0_12px_40px_rgba(16,185,129,0.18)]",
      iconBg: "bg-emerald-400/14 border-emerald-400/20 text-emerald-200",
      orb: "bg-emerald-400/22",
      accent: "bg-emerald-400",
      good: (stats?.winRate ?? 0) >= 50,
    },
    {
      label: "Total P&L",
      value: loading ? "…" : `$${(stats?.totalProfitLoss ?? 0).toFixed(0)}`,
      meta: stats ? (stats.totalProfitLoss >= 0 ? "In profit — keep compounding" : "In drawdown — review risk") : "No P&L yet",
      icon: DollarSign,
      // gold / amber — hero colour
      bg: "from-amber-400/18 via-[#f2c14e]/12 to-transparent",
      border: "border-amber-400/25",
      glow: "shadow-[0_12px_40px_rgba(242,193,78,0.20)]",
      iconBg: "bg-amber-400/14 border-amber-400/20 text-amber-200",
      orb: "bg-amber-400/22",
      accent: "bg-amber-400",
      good: (stats?.totalProfitLoss ?? 0) >= 0,
      featured: true,
    },
    {
      label: "Profit Factor",
      value: loading
        ? "…"
        : (stats?.profitFactor ?? 0) === Infinity
          ? "∞"
          : (stats?.profitFactor ?? 0).toFixed(2),
      meta: stats?.profitFactor ? (stats.profitFactor > 1.4 ? "Excellent" : stats.profitFactor > 1 ? "Profitable" : "Needs work") : "No closed trades yet",
      icon: TrendingUp,
      // violet / fuchsia
      bg: "from-violet-500/18 via-fuchsia-500/10 to-transparent",
      border: "border-violet-400/20",
      glow: "shadow-[0_12px_40px_rgba(139,92,246,0.18)]",
      iconBg: "bg-violet-400/14 border-violet-400/20 text-violet-200",
      orb: "bg-violet-400/22",
      accent: "bg-violet-400",
      good: (stats?.profitFactor ?? 0) >= 1,
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-7">
      {/* ——— hero greeting: full-bleed colourful card ——— */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1428]/70 backdrop-blur-xl"
      >
        {/* mesh & orbs */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-[#7c8cff]/8 to-accent/10" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-amber-400/18 blur-[70px]" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-[320px] w-[320px] rounded-full bg-cyan-400/14 blur-[70px]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.06]" />

        <div className="relative flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] font-bold tracking-[0.14em] text-white/70">COCKPIT LIVE</span>
              <span className="hidden sm:inline text-[11px] text-white/30">• 16 pairs streaming</span>
            </div>

            <h1 className="mt-4 font-display text-[26px] sm:text-[32px] lg:text-[34px] font-bold leading-none tracking-tight text-white">
              {greeting}, <span className="bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">{firstName}</span>
              <span className="font-light text-white/60"> —</span> welcome back
            </h1>

            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/45">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                <Clock className="h-3.5 w-3.5 text-primary" /> {today}
              </span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span>Here’s what’s happening with your trading today.</span>
            </p>

            {/* tiny inline stats */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { k: "Open", v: loading ? "…" : String(stats?.open ?? 0), c: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200" },
                { k: "Win rate", v: loading ? "…" : `${(stats?.winRate ?? 0).toFixed(0)}%`, c: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" },
                { k: "P&L", v: loading ? "…" : `$${(stats?.totalProfitLoss ?? 0).toFixed(0)}`, c: "border-amber-400/20 bg-amber-400/10 text-amber-200" },
              ].map((p) => (
                <span key={p.k} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold", p.c)}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                  {p.k} <span className="text-white">{p.v}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link
              href="/dashboard/trading"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_12px_32px_rgba(242,193,78,0.32)] transition hover:shadow-[0_16px_40px_rgba(242,193,78,0.42)] hover:scale-[1.02]"
            >
              <Sparkles className="h-4 w-4" />
              Open Trading Lens
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              <span className="absolute inset-0 -translate-x-[130%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-12deg] transition group-hover:translate-x-[130%] duration-700" />
            </Link>
            <Link
              href="/dashboard/journal"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-6 py-3.5 text-sm font-bold text-white backdrop-blur hover:bg-white/[0.1] transition"
            >
              View Journal <ArrowRight className="h-4 w-4 opacity-60" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ——— colourful metric mosaic ——— */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={cn(
              "group relative overflow-hidden rounded-[22px] border bg-[#0b1428]/70 p-4 sm:p-5 backdrop-blur-xl transition-all",
              t.border,
              t.glow,
              t.featured && "lg:scale-[1.02] lg:-rotate-[0.3deg]"
            )}
          >
            {/* colourful wash */}
            <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90", t.bg)} />
            <div className={cn("pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl opacity-60", t.orb)} />
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.04]" />
            {/* shine sweep */}
            <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-18deg] opacity-0 transition duration-700 group-hover:translate-x-[120%] group-hover:opacity-100" />
            {/* bottom accent line */}
            <span className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-[2px] opacity-70", t.accent)} />

            <div className="relative flex items-start justify-between gap-2">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur", t.iconBg)}>
                <t.icon className="h-5 w-5" />
              </span>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none",
                  typeof t.good === "boolean"
                    ? t.good
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                      : "border-red-400/20 bg-red-400/10 text-red-200"
                    : "border-white/10 bg-white/[0.06] text-white/60"
                )}
              >
                {t.meta}
              </span>
            </div>

            <p className="relative mt-4 font-display text-[26px] sm:text-[28px] font-bold leading-none tracking-tight text-white">
              {loading ? (
                <span className="inline-flex items-center gap-2 text-white/30">
                  <Loader2 className="h-5 w-5 animate-spin" /> …
                </span>
              ) : (
                t.value
              )}
            </p>
            <p className="relative mt-1 text-xs font-bold tracking-[0.08em] text-white/45">{t.label.toUpperCase()}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ——— bento: lenses + performance ——— */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* lenses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Quick Actions
            </h2>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold tracking-wide text-white/30">
              4 lenses • one loop
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                whileHover={{ y: -6 }}
                className="group relative"
              >
                <Link href={a.href} className="block">
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-[22px] border bg-[#0b1428]/70 backdrop-blur transition-all",
                      a.ring,
                      "hover:bg-[#0f1f3f]/70 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
                    )}
                  >
                    {/* top gradient band */}
                    <div className={cn("relative h-[112px] bg-gradient-to-br p-4", a.grad)}>
                      <div className="absolute inset-0 bg-grid opacity-[0.12]" />
                      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/18 blur-2xl" />
                      <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-xl" />
                      <div className={cn("relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 backdrop-blur", a.iconWrap)}>
                        <a.icon className="h-6 w-6" />
                      </div>
                      <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#050a18] shadow">
                        <span className={cn("h-1.5 w-1.5 rounded-full", a.dot)} /> LIVE
                      </span>
                    </div>

                    <div className="relative p-5">
                      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition group-hover:opacity-100", a.soft)} />
                      <div className="relative">
                        <h3 className="font-display text-[15px] font-bold text-white group-hover:text-white transition">
                          {a.title}
                        </h3>
                        <p className="mt-1 text-sm leading-5 text-white/45">{a.desc}</p>
                        <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white/70 group-hover:border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground transition">
                          Open <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>

                    <span className="pointer-events-none absolute inset-0 -translate-x-[125%] bg-gradient-to-r from-transparent via-white/8 to-transparent skew-x-[-18deg] transition duration-700 group-hover:translate-x-[125%]" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* performance / activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-300" /> Performance
            </h2>
            <Link href="/dashboard/journal" className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition">
              View all →
            </Link>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0b1428]/70 backdrop-blur">
            {stats?.bestTrade ? (
              <>
                {/* best */}
                <div className="relative p-4 hover:bg-white/[0.03] transition">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.06] to-transparent opacity-60" />
                  <div className="relative">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-emerald-300 flex items-center gap-1">
                      <Crown className="h-3 w-3" /> BEST TRADE
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/12 border border-emerald-400/20 text-emerald-300">
                          <TrendingUp className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{stats.bestTrade.pair}</p>
                          <p className="text-xs text-white/40 truncate">{stats.bestTrade.strategy || "No strategy"}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-400/14 border border-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-200">
                        +{stats.bestTrade.pips?.toFixed(1)} pips
                      </span>
                    </div>
                  </div>
                </div>

                {/* worst */}
                <div className="relative border-t border-white/[0.06] p-4 hover:bg-white/[0.03] transition">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/[0.05] to-transparent opacity-60" />
                  <div className="relative">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-red-300">WORST TRADE</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-400/10 border border-red-400/20 text-red-300">
                          <TrendingDown className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{stats?.worstTrade?.pair}</p>
                          <p className="text-xs text-white/40 truncate">{stats?.worstTrade?.strategy || "No strategy"}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-red-400/12 border border-red-400/20 px-2.5 py-1 text-xs font-bold text-red-200">
                        {stats?.worstTrade?.pips?.toFixed(1)} pips
                      </span>
                    </div>
                  </div>
                </div>

                {/* most traded */}
                {stats.topPairs?.[0] && (
                  <div className="relative border-t border-white/[0.06] p-4 hover:bg-white/[0.03] transition">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400/[0.06] to-transparent opacity-60" />
                    <div className="relative">
                      <p className="text-[10px] font-bold tracking-[0.14em] text-amber-300">MOST TRADED</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/12 border border-amber-400/20 text-amber-200">
                          <BarChart3 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white">{stats.topPairs[0].pair}</p>
                          <p className="text-xs text-white/40">{stats.topPairs[0].count} trades • favourite pair</p>
                        </div>
                        <span className="ml-auto hidden sm:inline-flex rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-1 text-xs font-bold text-white/60">
                          {stats.topPairs[0].count}×
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* monthly P&L — now colourful bars with glow */}
                {stats.monthlyPnL?.length > 0 && (
                  <div className="border-t border-white/[0.06] p-4 bg-white/[0.02]">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-white/40 flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-primary" /> MONTHLY P&L
                    </p>
                    <div className="mt-3 flex items-end gap-1.5 h-[56px]">
                      {stats.monthlyPnL.slice(-6).map((m: any, i: number) => {
                        const maxAbs = Math.max(...stats.monthlyPnL.slice(-6).map((x: any) => Math.abs(x.profitLoss)), 1);
                        const h = (Math.abs(m.profitLoss) / maxAbs) * 100;
                        const pos = m.profitLoss >= 0;
                        return (
                          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                            <div
                              className={cn(
                                "w-full rounded-t-[8px] border-t border-white/10 relative overflow-hidden",
                                pos
                                  ? "bg-gradient-to-t from-emerald-500 to-teal-400 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                                  : "bg-gradient-to-t from-red-500 to-orange-400 shadow-[0_0_16px_rgba(239,68,68,0.30)]"
                              )}
                              style={{ height: `${Math.max(h, 10)}%` }}
                            >
                              <span className="absolute inset-0 bg-gradient-to-b from-white/18 to-transparent" />
                            </div>
                            <span className="text-[10px] font-bold tracking-wide text-white/30">{m.month.slice(0, 3)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-indigo-500/20 border border-white/10">
                  <ScrollText className="h-7 w-7 text-white/40" />
                </div>
                <h3 className="mt-4 font-display text-sm font-bold text-white">No trades yet</h3>
                <p className="mx-auto mt-1 max-w-[22ch] text-xs leading-5 text-white/40">Start logging trades to unlock streaks, rankings and monthly P&L.</p>
                <Link href="/dashboard/journal" className="mt-4 inline-flex">
                  <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-white">
                    Go to Journal
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* streak mini-card */}
          {stats && (stats as any).currentStreak !== undefined && (
            <div className="rounded-[18px] border border-orange-400/15 bg-gradient-to-br from-orange-500/12 via-amber-500/8 to-transparent p-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/14 border border-orange-400/20 text-orange-300">
                <Flame className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold tracking-wide text-orange-300">CURRENT STREAK</p>
                <p className="text-sm font-bold text-white">{(stats as any).currentStreak ?? 0} days • keep going!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ——— CTA — colourful upgrade strip ——— */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        className="relative overflow-hidden rounded-[24px] border border-white/10 p-[1px]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-fuchsia-400 to-cyan-400 opacity-80" />
        <div className="relative rounded-[23px] bg-[#0b1428] p-6 sm:p-7 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-cyan-400/15 blur-2xl" />
          <div className="relative flex gap-4">
            <span className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
              <Zap className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-display text-[18px] font-bold text-white flex items-center gap-2">
                Ready to level up? <Sparkles className="h-4 w-4 text-amber-300" />
              </h3>
              <p className="mt-1 max-w-xl text-sm leading-6 text-white/50">Advanced AI analysis, live chart intel and expert courses — everything in one cockpit. Upgrade in 30 seconds.</p>
            </div>
          </div>
          <Link
            href="/dashboard/subscription"
            className="relative shrink-0 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-[#050a18] shadow-[0_10px_24px_rgba(255,255,255,0.12)] hover:bg-primary hover:text-primary-foreground transition"
          >
            View Plans <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
