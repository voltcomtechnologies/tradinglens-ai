"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Brain,
  BookOpen,
  BarChart3,
  ScrollText,
  ArrowRight,
  Activity,
  DollarSign,
  Target,
  Zap,
  Loader2,
  Sparkles,
  ArrowUpRight,
  Clock,
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

const quickActions = [
  {
    title: "Trading Lens",
    description: "Live AI signals with full reasoning",
    href: "/dashboard/trading",
    icon: Brain,
    accent: "from-primary/20 via-primary/5 to-transparent",
    iconBg: "bg-primary/12 border-primary/20",
    iconColor: "text-primary",
  },
  {
    title: "Chart Lens",
    description: "Real-time forex charts • 16 pairs",
    href: "/dashboard/charts",
    icon: BarChart3,
    accent: "from-accent/20 via-accent/5 to-transparent",
    iconBg: "bg-accent/10 border-accent/20",
    iconColor: "text-accent",
  },
  {
    title: "Edu Lens",
    description: "Courses, PDFs & adaptive quizzes",
    href: "/dashboard/learn",
    icon: BookOpen,
    accent: "from-violet-400/20 via-violet-400/5 to-transparent",
    iconBg: "bg-violet-400/10 border-violet-400/20",
    iconColor: "text-violet-300",
  },
  {
    title: "Trading Journal",
    description: "Track, review & compound results",
    href: "/dashboard/journal",
    icon: ScrollText,
    accent: "from-emerald-400/15 via-emerald-400/5 to-transparent",
    iconBg: "bg-emerald-400/10 border-emerald-400/20",
    iconColor: "text-emerald-300",
  },
];

export function DashboardOverview({ user }: DashboardOverviewProps) {
  const { data: stats, isLoading: statsLoading } = useJournalStats();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const statCards = [
    {
      label: "Total Trades",
      value: statsLoading ? "…" : String(stats?.total ?? 0),
      sub: stats?.total ? `${stats.closed || 0} closed` : "No trades yet",
      good: true,
      icon: Activity,
      tint: "border-white/[0.07] bg-white/[0.03] text-white/60",
      iconBg: "bg-white/[0.06] border-white/10",
    },
    {
      label: "Win Rate",
      value: statsLoading ? "…" : `${(stats?.winRate ?? 0).toFixed(0)}%`,
      sub: stats?.winRate ? `${stats.winning} wins` : "No data",
      good: (stats?.winRate ?? 0) >= 50,
      icon: Target,
      tint: "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300",
      iconBg: "bg-emerald-400/10 border-emerald-400/15",
    },
    {
      label: "Total P&L",
      value: statsLoading ? "…" : `$${(stats?.totalProfitLoss ?? 0).toFixed(0)}`,
      sub: stats ? (stats.totalProfitLoss >= 0 ? "In profit" : "In drawdown") : "No data",
      good: (stats?.totalProfitLoss ?? 0) >= 0,
      icon: DollarSign,
      tint: "border-primary/15 bg-primary/[0.06] text-primary",
      iconBg: "bg-primary/10 border-primary/15",
    },
    {
      label: "Profit Factor",
      value: statsLoading
        ? "…"
        : (stats?.profitFactor ?? 0) === Infinity
          ? "∞"
          : (stats?.profitFactor ?? 0).toFixed(2),
      sub: stats?.profitFactor ? (stats.profitFactor > 1 ? "Profitable" : "Needs work") : "No data",
      good: (stats?.profitFactor ?? 0) >= 1,
      icon: TrendingUp,
      tint: "border-violet-400/15 bg-violet-400/[0.06] text-violet-300",
      iconBg: "bg-violet-400/10 border-violet-400/15",
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-primary">
              <Sparkles className="h-3 w-3" /> COCKPIT
            </div>
            <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {greeting}, {user.name || "Trader"} <span className="inline-block">—</span> welcome back
            </h1>
            <p className="mt-1.5 text-sm text-white/50 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Here’s your trading overview for today •{" "}
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <Link
            href="/dashboard/trading"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_10px_24px_rgba(242,193,78,0.28)] hover:shadow-[0_14px_32px_rgba(242,193,78,0.38)] transition-all"
          >
            Open Trading Lens <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04 }}
            className={cn(
              "relative overflow-hidden rounded-[20px] border p-4 sm:p-5 backdrop-blur",
              s.tint,
              "bg-[#0b1428]/60"
            )}
          >
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/[0.04] blur-xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl border", s.iconBg)}>
                <s.icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-bold",
                  s.good ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-red-400/20 bg-red-400/10 text-red-300"
                )}
              >
                {s.sub}
              </span>
            </div>
            <p className="relative mt-4 font-display text-2xl font-bold tracking-tight text-white">
              {statsLoading ? (
                <span className="inline-flex items-center gap-2 text-white/40">
                  <Loader2 className="h-4 w-4 animate-spin" /> …
                </span>
              ) : (
                s.value
              )}
            </p>
            <p className="text-xs font-medium tracking-wide text-white/40 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Quick Actions</h2>
            <span className="text-xs text-white/30">4 lenses • one loop</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.04 }}
              >
                <Link href={a.href} className="group block">
                  <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur p-5 hover:border-primary/20 hover:bg-white/[0.04] transition-all">
                    <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity", a.accent)} />
                    <div className="relative">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", a.iconBg)}>
                        <a.icon className={cn("h-5 w-5", a.iconColor)} />
                      </div>
                      <h3 className="mt-3 font-display font-semibold text-white group-hover:text-primary transition-colors">{a.title}</h3>
                      <p className="mt-1 text-sm text-white/45">{a.description}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold tracking-wide text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Open <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Recent Activity</h2>
            <Link href="/dashboard/journal" className="text-xs font-semibold text-primary hover:text-white transition-colors">
              View all →
            </Link>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur divide-y divide-white/[0.06]">
            {stats?.bestTrade ? (
              <>
                <div className="p-4 hover:bg-white/[0.03] transition-colors">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-white/30">BEST TRADE</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10 border border-emerald-400/15 text-emerald-300">
                        <TrendingUp className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{stats.bestTrade.pair}</p>
                        <p className="text-[11px] text-white/40">{stats.bestTrade.strategy || "No strategy"}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-300">+{stats.bestTrade.pips?.toFixed(1)} pips</p>
                  </div>
                </div>

                <div className="p-4 hover:bg-white/[0.03] transition-colors">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-white/30">WORST TRADE</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-400/10 border border-red-400/15 text-red-300">
                        <TrendingDown className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{stats?.worstTrade?.pair}</p>
                        <p className="text-[11px] text-white/40">{stats?.worstTrade?.strategy || "No strategy"}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-red-300">{stats?.worstTrade?.pips?.toFixed(1)} pips</p>
                  </div>
                </div>

                {stats.topPairs?.[0] && (
                  <div className="p-4 hover:bg-white/[0.03] transition-colors">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-white/30">MOST TRADED</p>
                    <div className="mt-2 flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/15 text-primary">
                        <BarChart3 className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{stats.topPairs[0].pair}</p>
                        <p className="text-[11px] text-white/40">{stats.topPairs[0].count} trades</p>
                      </div>
                    </div>
                  </div>
                )}

                {stats.monthlyPnL?.length > 0 && (
                  <div className="p-4">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-white/30">MONTHLY P&L</p>
                    <div className="mt-3 flex items-end gap-1.5 h-12">
                      {stats.monthlyPnL.slice(-6).map((m: any, i: number) => {
                        const maxAbs = Math.max(...stats.monthlyPnL.slice(-6).map((x: any) => Math.abs(x.profitLoss)), 1);
                        const h = (Math.abs(m.profitLoss) / maxAbs) * 100;
                        return (
                          <div key={i} className="flex flex-1 flex-col items-center gap-1">
                            <div
                              className={cn("w-full rounded-t-lg", m.profitLoss >= 0 ? "bg-emerald-400/60" : "bg-red-400/60")}
                              style={{ height: `${Math.max(h, 6)}%` }}
                            />
                            <span className="text-[9px] font-bold tracking-wide text-white/30">{m.month.slice(0, 3)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/10">
                  <ScrollText className="h-6 w-6 text-white/25" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white">No trades yet</h3>
                <p className="mt-1 text-xs text-white/40">Start logging trades to unlock analytics</p>
                <Link href="/dashboard/journal" className="mt-4 inline-flex">
                  <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-white">
                    Go to Journal
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        className="relative overflow-hidden rounded-[24px] border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-[#0b1428]/60 to-[#0b1428]/60 backdrop-blur p-6 sm:p-7 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <span className="hidden sm:flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20 text-primary shrink-0">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display font-semibold text-white">Ready to level up your trading?</h3>
            <p className="mt-1 text-sm text-white/50 max-w-xl">Advanced AI analysis, live charts, and expert courses — everything in one cockpit.</p>
          </div>
        </div>
        <Link href="/dashboard/subscription" className="relative shrink-0 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-white hover:text-[#050a18] transition-colors">
          View Plans
        </Link>
      </motion.div>
    </div>
  );
}
