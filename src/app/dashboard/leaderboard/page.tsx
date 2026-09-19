"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Search, TrendingUp, Users, RefreshCw, Crown, Flame, Sparkles } from "lucide-react";
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
          <div className="h-6 w-6 rounded-full bg-white/10 animate-pulse mb-2" />
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white/10 animate-pulse mb-2" />
          <div className="h-4 w-20 bg-white/10 animate-pulse rounded mb-1" />
          <div className="h-3 w-16 bg-white/10 animate-pulse rounded mb-2" />
          <div className={cn("rounded-t-2xl bg-white/10 animate-pulse", i === 1 ? "h-32 w-24" : i === 3 ? "h-20 w-20" : "h-24 w-20")} />
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

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-primary">
          <Trophy className="h-3.5 w-3.5" /> LEADERBOARD
        </div>
        <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">Top Traders</h1>
        <p className="mt-1.5 text-sm text-white/45">Compete globally. Ranked by pips earned — discipline wins.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn("rounded-full px-4 py-2 text-sm font-bold transition-colors", period === p.value ? "bg-primary text-primary-foreground shadow" : "text-white/40 hover:text-white")}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <input type="text" placeholder="Search traders…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-full border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/30" />
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} className="rounded-full border-white/10 bg-white/[0.04] text-white/40 hover:text-white shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {isLoading && (
        <div className="space-y-6">
          <PodiumSkeleton />
          <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0b1428]/60">
            <div className="p-4 border-b border-white/10"><div className="h-5 w-40 bg-white/10 animate-pulse rounded" /></div>
            <div className="divide-y divide-white/10">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-8 h-5 bg-white/10 animate-pulse rounded" /><div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
                  <div className="flex-1 space-y-1"><div className="h-4 w-32 bg-white/10 animate-pulse rounded" /><div className="h-3 w-20 bg-white/10 animate-pulse rounded" /></div>
                  <div className="h-4 w-16 bg-white/10 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && !isLoading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[20px] border border-red-400/15 bg-red-400/5 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 border border-red-400/15 text-red-300"><Trophy className="h-6 w-6" /></div>
          <h3 className="mt-4 font-display font-semibold text-white">Failed to load leaderboard</h3>
          <p className="mt-1 text-sm text-white/45">Please try again.</p>
          <Button variant="outline" className="mt-4 rounded-full border-white/10 bg-white/[0.04] text-white" onClick={() => { toast.dismiss(); refetch(); }}>Retry</Button>
        </motion.div>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[20px] border border-white/10 bg-[#0b1428]/40 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 text-primary"><Users className="h-6 w-6" /></div>
          <h3 className="mt-4 font-display font-semibold text-white">{search ? "No Traders Found" : "No Rankings Yet"}</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-white/45">{search ? `No traders match "${search}".` : "Close your first position to appear on the leaderboard. Ranked by total pips."}</p>
        </motion.div>
      )}

      {!isLoading && !error && top3.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur p-6 sm:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex items-end justify-center gap-3 sm:gap-6">
            {top3[1] && (
              <div className="flex flex-col items-center">
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white/50"><Medal className="h-3 w-3" /> #2</span>
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-white/10"><AvatarFallback className="bg-white/10 text-white/70 text-sm font-bold">{getInitials(top3[1].user.name)}</AvatarFallback></Avatar>
                <p className="mt-2 text-sm font-semibold text-white text-center">{top3[1].user.name}</p>
                <p className="text-xs text-white/40">{top3[1].totalPips.toFixed(0)} pips</p>
                <div className="mt-3 h-20 w-16 sm:h-24 sm:w-20 rounded-t-2xl border border-white/10 bg-white/[0.04]" />
              </div>
            )}
            {top3[0] && (
              <div className="flex flex-col items-center -mt-6">
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/20 px-2.5 py-1 text-xs font-bold text-primary"><Crown className="h-3.5 w-3.5" /> #1</span>
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-primary/20"><AvatarFallback className="bg-gradient-to-br from-primary to-[#d4a017] text-primary-foreground text-lg font-bold">{getInitials(top3[0].user.name)}</AvatarFallback></Avatar>
                <p className="mt-2 text-sm sm:text-base font-bold text-white text-center">{top3[0].user.name}</p>
                <p className="text-xs sm:text-sm font-bold text-primary">{top3[0].totalPips.toFixed(0)} pips</p>
                <div className="mt-3 h-28 w-20 sm:h-32 sm:w-24 rounded-t-2xl border border-primary/20 bg-primary/10" />
              </div>
            )}
            {top3[2] && (
              <div className="flex flex-col items-center">
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300"><Medal className="h-3 w-3" /> #3</span>
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-amber-500/20"><AvatarFallback className="bg-amber-500/15 text-amber-300 text-sm font-bold">{getInitials(top3[2].user.name)}</AvatarFallback></Avatar>
                <p className="mt-2 text-sm font-semibold text-white text-center">{top3[2].user.name}</p>
                <p className="text-xs text-white/40">{top3[2].totalPips.toFixed(0)} pips</p>
                <div className="mt-3 h-16 w-16 sm:h-20 sm:w-20 rounded-t-2xl border border-amber-500/15 bg-amber-500/10" />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
            <h3 className="font-display font-semibold text-white text-sm">
              {period === "all" ? "All Time Rankings" : period === "monthly" ? "This Month" : "This Week"} <span className="font-normal text-white/30 ml-1">({data?.total ?? 0})</span>
            </h3>
            <div className="hidden sm:flex items-center gap-6 text-xs font-bold tracking-wide text-white/25">
              <span className="w-16 text-right">WR</span><span className="w-16 text-right">Trades</span><span className="w-16 text-right">PF</span>
            </div>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {entries.map((entry: any, i: number) => (
              <div key={`${entry.rank}-${entry.user.name}`} className={cn("flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-white/[0.03] transition-colors", i < 3 && "bg-primary/[0.03]")}>
                <span className={cn("w-8 text-center text-sm font-bold shrink-0", i === 0 ? "text-primary" : i === 1 ? "text-white/60" : i === 2 ? "text-amber-300" : "text-white/25")}>#{entry.rank}</span>
                <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className={cn("text-xs font-bold", i === 0 ? "bg-primary/15 text-primary" : "bg-white/10 text-white/60")}>{getInitials(entry.user.name)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate flex items-center gap-1.5">{entry.user.name}{entry.streak >= 5 && <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />}</p>
                  <p className="text-xs text-white/30">🔥 {entry.streak} day streak</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-sm text-white/50">
                  <span className="w-16 text-right">{entry.winRate.toFixed(0)}%</span><span className="w-16 text-right">{entry.totalTrades}</span><span className="w-16 text-right">{formatProfitFactor(entry.profitFactor)}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("text-sm font-bold", entry.totalPips >= 0 ? "text-emerald-300" : "text-red-300")}>{entry.totalPips >= 0 ? "+" : ""}{entry.totalPips.toFixed(0)}</p>
                  <p className="text-xs text-white/30 sm:hidden">{entry.winRate.toFixed(0)}% · {entry.totalTrades}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!isLoading && !error && currentUser && entries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-[20px] border border-primary/15 bg-primary/[0.06] backdrop-blur p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", currentUser.rank <= 3 ? "bg-primary/15 border-primary/20 text-primary" : "bg-white/[0.04] border-white/10 text-white/30")}><TrendingUp className="h-5 w-5" /></span>
            <div><p className="text-xs font-bold tracking-wide text-white/40">YOUR RANKING</p><p className="font-display font-bold text-white">#{currentUser.rank} of {data?.total ?? 0}</p></div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center"><p className="font-bold text-white">{currentUser.totalPips.toFixed(0)}</p><p className="text-xs text-white/30">Pips</p></div>
            <div className="text-center"><p className="font-bold text-white">{currentUser.winRate.toFixed(0)}%</p><p className="text-xs text-white/30">WR</p></div>
            <div className="text-center"><p className="font-bold text-white">{currentUser.totalTrades}</p><p className="text-xs text-white/30">Trades</p></div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
