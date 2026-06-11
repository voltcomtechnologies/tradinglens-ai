"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Search, TrendingUp, Users, RefreshCw, Crown, Flame } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLeaderboard, getInitials, formatProfitFactor } from "@/lib/hooks/use-leaderboard";
import { toast } from "sonner";

const PERIODS = [
  { value: "all", label: "All Time" },
  { value: "monthly", label: "This Month" },
  { value: "weekly", label: "This Week" },
];

function PodiumSkeleton() {
  return (
    <div className="flex items-end justify-center gap-4 pt-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center">
          <div className={cn("h-6 w-6 rounded-full bg-muted animate-pulse mb-2")} />
          <div className={cn("rounded-full bg-muted animate-pulse mb-2", i === 2 ? "h-16 w-16" : "h-16 w-16")} />
          <div className="h-4 w-20 bg-muted animate-pulse rounded mb-1" />
          <div className="h-3 w-16 bg-muted animate-pulse rounded mb-2" />
          <div className={cn("rounded-t-xl bg-muted animate-pulse", i === 1 ? "h-32 w-24" : i === 3 ? "h-20 w-20" : "h-24 w-20")} />
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = useLeaderboard(period, search);

  const entries = data?.entries ?? [];
  const currentUser = data?.currentUser;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
        </div>
        <p className="text-muted-foreground">
          Compete with other traders. Top performers earn rewards and recognition.
        </p>
      </motion.div>

      {/* Filters bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-all font-medium",
                period === p.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search traders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6">
          <PodiumSkeleton />
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="h-5 w-40 bg-muted animate-pulse rounded" />
            </div>
            <div className="divide-y divide-border">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-8 h-5 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" />
                    <div className="h-3 w-12 bg-muted animate-pulse rounded ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-12 text-center"
        >
          <div className="p-3 rounded-xl bg-red-500/10 mb-4 inline-block">
            <Trophy className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to Load Leaderboard</h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error fetching the leaderboard data. Please try again.
          </p>
          <Button variant="outline" onClick={() => { toast.dismiss(); refetch(); }}>
            Retry
          </Button>
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoading && !error && entries.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-12 text-center"
        >
          <div className="p-3 rounded-xl bg-amber-500/10 mb-4 inline-block">
            <Users className="h-8 w-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {search ? "No Traders Found" : "No Rankings Yet"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {search
              ? `No traders match "${search}". Try a different search term.`
              : "Start trading and close your first position to appear on the leaderboard. Trades are ranked by total pips earned."}
          </p>
        </motion.div>
      )}

      {/* Podium */}
      {!isLoading && !error && top3.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-end justify-center gap-3 sm:gap-4 pt-8"
        >
          {/* 2nd Place */}
          {top3[1] && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-2">
                <Medal className="h-4 w-4 text-slate-300" />
                <span className="text-xs font-bold text-slate-300">#2</span>
              </div>
              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-slate-300/30 ring-offset-2 ring-offset-background">
                <AvatarFallback className="bg-slate-300/20 text-slate-300 text-sm font-bold">
                  {getInitials(top3[1].user.name)}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium mt-2">{top3[1].user.name}</p>
              <p className="text-xs text-muted-foreground">{top3[1].totalPips.toFixed(0)} pips</p>
              <div className="mt-3 h-20 w-16 sm:h-24 sm:w-20 rounded-t-xl bg-gradient-to-t from-slate-300/15 to-transparent border border-slate-300/20" />
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="flex flex-col items-center -mt-8">
              <div className="flex items-center gap-1 mb-2">
                <Crown className="h-5 w-5 text-amber-400" />
                <span className="text-xs font-bold text-amber-400">#1</span>
              </div>
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-amber-400/20 ring-offset-2 ring-offset-background">
                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white text-lg font-bold">
                  {getInitials(top3[0].user.name)}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm sm:text-base font-bold mt-2 text-center">{top3[0].user.name}</p>
              <p className="text-xs sm:text-sm text-amber-400 font-medium">{top3[0].totalPips.toFixed(0)} pips</p>
              <div className="mt-3 h-28 w-20 sm:h-32 sm:w-24 rounded-t-xl bg-gradient-to-t from-amber-400/20 to-transparent border border-amber-400/30" />
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-2">
                <Medal className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-600">#3</span>
              </div>
              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-amber-600/30 ring-offset-2 ring-offset-background">
                <AvatarFallback className="bg-amber-600/20 text-amber-600 text-sm font-bold">
                  {getInitials(top3[2].user.name)}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium mt-2">{top3[2].user.name}</p>
              <p className="text-xs text-muted-foreground">{top3[2].totalPips.toFixed(0)} pips</p>
              <div className="mt-3 h-16 w-16 sm:h-20 sm:w-20 rounded-t-xl bg-gradient-to-t from-amber-600/15 to-transparent border border-amber-600/20" />
            </div>
          )}
        </motion.div>
      )}

      {/* Main rankings table */}
      {!isLoading && !error && entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">
              {period === "all" ? "All Time Rankings" : period === "monthly" ? "This Month" : "This Week"}
              <span className="text-muted-foreground font-normal ml-2">({data?.total ?? 0} traders)</span>
            </h3>
            <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground">
              <span className="w-16 text-right">Win Rate</span>
              <span className="w-16 text-right">Trades</span>
              <span className="w-16 text-right">Profit Factor</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {entries.map((entry, i) => (
              <div
                key={`${entry.rank}-${entry.user.name}`}
                className={cn(
                  "flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-muted/50 transition-colors",
                  i < 3 && "bg-gradient-to-r from-transparent via-amber-500/[0.03] to-transparent"
                )}
              >
                {/* Rank */}
                <span className={cn(
                  "w-8 text-center text-sm font-bold shrink-0",
                  i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                )}>
                  #{entry.rank}
                </span>

                {/* Avatar + Name */}
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={cn(
                    "text-xs font-medium",
                    i === 0 ? "bg-amber-400/20 text-amber-400" :
                    i === 1 ? "bg-slate-300/20 text-slate-300" :
                    i === 2 ? "bg-amber-600/20 text-amber-600" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {getInitials(entry.user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{entry.user.name}</p>
                    {entry.streak >= 5 && (
                      <span title={`${entry.streak} day streak`}>
                        <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    🔥 {entry.streak} day streak
                  </p>
                </div>

                {/* Desktop stats */}
                <div className="hidden sm:flex items-center gap-6 text-sm">
                  <span className="w-16 text-right text-muted-foreground">
                    {entry.winRate.toFixed(0)}%
                  </span>
                  <span className="w-16 text-right text-muted-foreground">
                    {entry.totalTrades}
                  </span>
                  <span className="w-16 text-right text-muted-foreground">
                    {formatProfitFactor(entry.profitFactor)}
                  </span>
                </div>

                {/* Pips */}
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-sm font-medium",
                    entry.totalPips >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {entry.totalPips >= 0 ? "+" : ""}{entry.totalPips.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground sm:hidden">
                    {entry.winRate.toFixed(0)}% · {entry.totalTrades} trades
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Current user card */}
      {!isLoading && !error && currentUser && entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                currentUser.rank <= 3 ? "bg-amber-500/10" : "bg-muted"
              )}>
                <TrendingUp className={cn(
                  "h-5 w-5",
                  currentUser.rank <= 3 ? "text-amber-400" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Ranking</p>
                <p className="font-semibold">#{currentUser.rank} of {data?.total ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-sm">
              <div className="text-right">
                <p className="font-medium">{currentUser.totalPips.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Pips</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{currentUser.winRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{currentUser.totalTrades}</p>
                <p className="text-xs text-muted-foreground">Trades</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
