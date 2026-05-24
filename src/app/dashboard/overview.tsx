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
    description: "AI-powered chart analysis & trade signals",
    href: "/dashboard/trading",
    icon: Brain,
    gradient: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    title: "Chart Lens",
    description: "Real-time forex charts with AI insights",
    href: "/dashboard/charts",
    icon: BarChart3,
    gradient: "from-accent/20 to-accent/5",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    title: "Edu Lens",
    description: "Expert-led courses & interactive quizzes",
    href: "/dashboard/learn",
    icon: BookOpen,
    gradient: "from-purple-500/20 to-purple-600/5",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
  },
  {
    title: "Trading Journal",
    description: "Track, analyze & improve your trades",
    href: "/dashboard/journal",
    icon: ScrollText,
    gradient: "from-rose-500/20 to-rose-600/5",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
  },
];

export function DashboardOverview({ user }: DashboardOverviewProps) {
  const { data: stats, isLoading: statsLoading } = useJournalStats();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  // Build stat cards from real data
  const statCards = [
    {
      label: "Total Trades",
      value: statsLoading ? "..." : String(stats?.total ?? 0),
      change: stats?.total ? `+${stats.closed || 0} closed` : "No trades yet",
      positive: true,
      icon: Activity,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      label: "Win Rate",
      value: statsLoading ? "..." : `${(stats?.winRate ?? 0).toFixed(0)}%`,
      change: stats?.winRate ? `${stats.winning} wins` : "No data",
      positive: (stats?.winRate ?? 0) >= 50,
      icon: Target,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      label: "Total P&L",
      value: statsLoading ? "..." : `$${(stats?.totalProfitLoss ?? 0).toFixed(0)}`,
      change: stats?.totalProfitLoss
        ? stats.totalProfitLoss >= 0
          ? `+${(stats.totalProfitLoss / (stats.total || 1) * 100).toFixed(0)}%`
          : `${(stats.totalProfitLoss / (stats.total || 1) * 100).toFixed(0)}%`
        : "No data",
      positive: (stats?.totalProfitLoss ?? 0) >= 0,
      icon: DollarSign,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
    },
    {
      label: "Profit Factor",
      value: statsLoading ? "..." : (stats?.profitFactor ?? 0) === Infinity
        ? "∞"
        : (stats?.profitFactor ?? 0).toFixed(2),
      change: stats?.profitFactor
        ? stats.profitFactor > 1 ? "Profitable" : "Needs work"
        : "No data",
      positive: (stats?.profitFactor ?? 0) >= 1,
      icon: TrendingUp,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold">
          {greeting}, {user.name || "Trader"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s your trading overview for today
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="relative group"
          >
            <div className="rounded-xl border border-border bg-card p-4 lg:p-5 hover:border-primary/30 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("p-2 rounded-lg", stat.iconBg)}>
                  <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    stat.positive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  )}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold">
                {statsLoading ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </span>
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, i) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <Link href={action.href} className="block group">
                  <div className="relative rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all duration-300 overflow-hidden">
                    <div
                      className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                        "bg-gradient-to-br",
                        action.gradient
                      )}
                    />
                    <div className="relative">
                      <div className={cn("p-2.5 rounded-lg w-fit mb-3", action.iconBg)}>
                        <action.icon className={cn("h-5 w-5", action.iconColor)} />
                      </div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {action.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        Open <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link
              href="/dashboard/journal"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {stats?.bestTrade ? (
              <>
                {/* Best trade */}
                <div className="p-3 hover:bg-muted/50 transition-colors">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Best Trade</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-emerald-500/10">
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{stats.bestTrade.pair}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {stats.bestTrade.strategy || "No strategy"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-400">
                        +{stats.bestTrade.pips?.toFixed(1)} pips
                      </p>
                    </div>
                  </div>
                </div>

                {/* Worst trade */}
                <div className="p-3 hover:bg-muted/50 transition-colors">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Worst Trade</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-red-500/10">
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{stats?.worstTrade?.pair}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {stats?.worstTrade?.strategy || "No strategy"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-400">
                        {stats?.worstTrade?.pips?.toFixed(1)} pips
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top pair */}
                {stats.topPairs?.[0] && (
                  <div className="p-3 hover:bg-muted/50 transition-colors">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Most Traded</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-primary/10">
                          <BarChart3 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{stats.topPairs[0].pair}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {stats.topPairs[0].count} trades
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Monthly P&L sparkline */}
                {stats.monthlyPnL?.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                      Monthly P&L
                    </p>
                    <div className="flex items-end gap-1 h-12">
                      {stats.monthlyPnL.slice(-6).map((m, i) => {
                        const maxAbs = Math.max(
                          ...stats.monthlyPnL.slice(-6).map((x) => Math.abs(x.profitLoss)),
                          1
                        );
                        const height = (Math.abs(m.profitLoss) / maxAbs) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className={cn(
                                "w-full rounded-t",
                                m.profitLoss >= 0 ? "bg-emerald-500/60" : "bg-red-500/60"
                              )}
                              style={{ height: `${Math.max(height, 4)}%` }}
                            />
                            <span className="text-[8px] text-muted-foreground">
                              {m.month.slice(0, 3)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center">
                <div className="p-3 rounded-xl bg-muted/30 mb-3 inline-block">
                  <ScrollText className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-sm font-medium mb-1">No trades yet</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Start logging your trades in the journal
                </p>
                <Link href="/dashboard/journal">
                  <Button variant="outline" size="sm">
                    Go to Journal
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative rounded-xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10" />
        <div className="relative p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Ready to level up your trading?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Access advanced AI analysis, live charts, and expert courses with our Pro plan.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/subscription"
            className="shrink-0 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            View Plans
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
