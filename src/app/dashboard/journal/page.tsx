"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ScrollText,
  Plus,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  BarChart3,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useJournalEntries,
  useJournalStats,
  getUniquePairs,
  getPipColor,
  type JournalEntry,
} from "@/lib/hooks/use-journal";
import { TradeForm } from "@/components/journal/trade-form";
import { TradeDetail } from "@/components/journal/trade-detail";

export default function JournalPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pairFilter, setPairFilter] = useState<string>("");
  const [strategyFilter, setStrategyFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = useMemo(
    () => ({
      ...(statusFilter && { status: statusFilter }),
      ...(pairFilter && { pair: pairFilter }),
      sort: sortBy,
      limit: 100,
    }),
    [statusFilter, pairFilter, sortBy]
  );

  const { data, isLoading, isError, refetch } = useJournalEntries(filters);
  const { data: stats, isLoading: statsLoading } = useJournalStats();

  const entries = useMemo(() => data?.entries ?? [], [data?.entries]);
  const filteredEntries = useMemo(() => {
    let result = entries;
    if (strategyFilter) result = result.filter((e: JournalEntry) => e.strategy === strategyFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e: JournalEntry) =>
          e.pair.toLowerCase().includes(q) ||
          e.notes?.toLowerCase().includes(q) ||
          e.strategy?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, strategyFilter, searchQuery]);

  const uniquePairs = useMemo(() => getUniquePairs(entries), [entries]);
  const uniqueStrategies = useMemo(() => {
    const s = new Set(entries.map((e: JournalEntry) => e.strategy).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-primary">
            <ScrollText className="h-3 w-3" /> JOURNAL
          </div>
          <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Trading Journal
            {stats && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-white/60">
                {stats.total} trades
              </span>
            )}
          </h1>
          <p className="mt-1.5 text-sm text-white/45">Track, analyze, and compound every decision.</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="rounded-full bg-primary text-primary-foreground hover:bg-white hover:text-[#050a18] gap-2 shadow-[0_10px_24px_rgba(242,193,78,0.25)]"
        >
          <Plus className="h-4 w-4" />
          New Entry
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-[20px] border border-white/10 bg-[#0b1428]/60 p-5 animate-pulse">
                <div className="h-6 w-20 bg-white/10 rounded mb-2" />
                <div className="h-4 w-16 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <PremiumStat label="Total Trades" value={String(stats.total)} sub={`${stats.open} open · ${stats.closed} closed`} />
            <PremiumStat
              label="Win Rate"
              value={`${stats.winRate}%`}
              sub={`${stats.winning}W / ${stats.losing}L`}
              tone={stats.winRate >= 50 ? "good" : "bad"}
            />
            <PremiumStat
              label="Total Pips"
              value={`${stats.totalPips >= 0 ? "+" : ""}${stats.totalPips}`}
              sub={`Factor: ${stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}`}
              tone={stats.totalPips >= 0 ? "good" : "bad"}
            />
            <PremiumStat
              label="Net P&L"
              value={`${stats.totalProfitLoss >= 0 ? "+" : ""}$${Math.abs(stats.totalProfitLoss).toLocaleString()}`}
              tone={stats.totalProfitLoss >= 0 ? "good" : "bad"}
            />
          </div>
        ) : null}
      </motion.div>

      {/* Monthly */}
      {stats?.monthlyPnL && stats.monthlyPnL.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/15 text-primary">
              <BarChart3 className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-white">Monthly Performance</span>
            <span className="ml-auto text-xs text-white/30">{stats.monthlyPnL.length} months</span>
          </div>
          <div className="flex items-end gap-2 h-20">
            {stats.monthlyPnL.map((m: { month: string; profitLoss: number }) => {
              const maxAbs = Math.max(...stats.monthlyPnL.map((x: { profitLoss: number }) => Math.abs(x.profitLoss)), 1);
              const h = Math.abs(m.profitLoss) / maxAbs;
              const pos = m.profitLoss >= 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className={cn("text-[10px] font-bold tabular-nums", pos ? "text-emerald-300" : "text-red-300")}>
                    {pos ? "+" : ""}${Math.abs(m.profitLoss).toFixed(0)}
                  </span>
                  <div className="w-full flex justify-center" style={{ height: `${Math.max(h * 100, 6)}%` }}>
                    <div className={cn("w-full rounded-t-lg", pos ? "bg-emerald-400/60" : "bg-red-400/60")} />
                  </div>
                  <span className="text-[10px] font-bold tracking-wide text-white/30">{m.month}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-[20px] border border-white/10 bg-[#0b1428]/40 backdrop-blur p-4 space-y-3"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold tracking-wide text-white/40">
            <Filter className="h-3.5 w-3.5" /> Filter
          </span>
          {[
            { label: "All", v: "" },
            { label: "Open", v: "OPEN" },
            { label: "Closed", v: "CLOSED" },
            { label: "Cancelled", v: "CANCELLED" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setStatusFilter(f.v)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
                statusFilter === f.v ? "bg-primary text-primary-foreground" : "bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pair, strategy, notes…"
              className="pl-10 h-10 rounded-full bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 focus:border-primary/30"
            />
          </div>

          <select
            value={pairFilter}
            onChange={(e) => setPairFilter(e.target.value)}
            className="h-10 rounded-full border border-white/10 bg-[#0b1428] px-4 text-sm text-white outline-none focus:border-primary/30"
          >
            <option value="">All Pairs</option>
            {uniquePairs.map((p: string) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
            className="h-10 rounded-full border border-white/10 bg-[#0b1428] px-4 text-sm text-white outline-none focus:border-primary/30"
          >
            <option value="">All Strategies</option>
            {uniqueStrategies.map((s: string) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-full border border-white/10 bg-[#0b1428] px-4 text-sm text-white outline-none focus:border-primary/30"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="pips_desc">Highest Pips</option>
            <option value="pips_asc">Lowest Pips</option>
            <option value="profit_desc">Best P&L</option>
          </select>

          <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full border border-white/10 bg-white/[0.04] text-white/50" onClick={() => refetch()}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-[20px] border border-white/10 bg-[#0b1428]/40 p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-white/10 rounded" />
                  <div className="h-3 w-16 bg-white/5 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 rounded-[24px] border border-red-400/15 bg-red-400/5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 border border-red-400/15 text-red-300">
            <TrendingDown className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display font-semibold text-white">Failed to load trades</h3>
          <p className="mt-1 text-sm text-white/45">Something went wrong. Please try again.</p>
          <Button variant="outline" className="mt-4 rounded-full border-white/10 bg-white/[0.04] text-white" onClick={() => refetch()}>
            Try Again
          </Button>
        </motion.div>
      )}

      {!isLoading && !isError && filteredEntries.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 rounded-[24px] border border-white/10 bg-[#0b1428]/40 backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/10 text-white/25">
            <ScrollText className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-white">
            {searchQuery || statusFilter || pairFilter ? "No matching trades" : "Your journal is empty"}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/45">
            {searchQuery || statusFilter || pairFilter
              ? "Try adjusting your filters."
              : "Record your first trade to unlock analytics, streaks, and performance insights."}
          </p>
          {!searchQuery && !statusFilter && !pairFilter && (
            <Button
              onClick={() => setShowForm(true)}
              className="mt-6 rounded-full bg-primary text-primary-foreground gap-2"
            >
              <Plus className="h-4 w-4" /> Record First Trade
            </Button>
          )}
        </motion.div>
      )}

      {!isLoading && !isError && filteredEntries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="space-y-3">
          {filteredEntries.map((entry: JournalEntry, i: number) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => setSelectedEntry(entry)}
              className="group cursor-pointer rounded-[18px] border border-white/10 bg-[#0b1428]/50 backdrop-blur p-4 sm:p-5 hover:border-primary/20 hover:bg-white/[0.03] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                      entry.direction === "BUY" ? "bg-emerald-400/10 border-emerald-400/15 text-emerald-300" : "bg-red-400/10 border-red-400/15 text-red-300"
                    )}
                  >
                    {entry.direction === "BUY" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-display font-semibold text-white">{entry.pair}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide", entry.direction === "BUY" ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/20" : "bg-red-400/15 text-red-300 border border-red-400/20")}>
                        {entry.direction}
                      </span>
                      <span className="rounded-full bg-white/[0.06] border border-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white/50">{entry.status}</span>
                    </div>
                    <p className="text-xs text-white/35 mt-1">
                      {new Date(entry.entryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • {entry.strategy || "No strategy"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("text-sm font-bold tabular-nums", getPipColor(entry.pips).includes("emerald") ? "text-emerald-300" : getPipColor(entry.pips).includes("red") ? "text-red-300" : "text-white/60")}>
                    {entry.pips != null ? `${entry.pips >= 0 ? "+" : ""}${entry.pips}` : "—"} <span className="text-[11px] font-normal text-white/30">pips</span>
                  </p>
                  {entry.profitLoss != null && (
                    <p className={cn("text-xs font-semibold tabular-nums", entry.profitLoss >= 0 ? "text-emerald-300/70" : "text-red-300/70")}>
                      {entry.profitLoss >= 0 ? "+" : ""}${entry.profitLoss.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-white/[0.04] border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/60">Entry {entry.entryPrice.toFixed(5)}</span>
                {entry.exitPrice && <span className="rounded-full bg-white/[0.04] border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/60">Exit {entry.exitPrice.toFixed(5)}</span>}
                {entry.lotSize && <span className="rounded-full bg-white/[0.04] border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/60">Lot {entry.lotSize}</span>}
                <span className="ml-auto hidden sm:inline-flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Details <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
              {entry.notes && <p className="mt-3 text-sm leading-6 text-white/45 line-clamp-1 group-hover:line-clamp-none">{entry.notes}</p>}
            </motion.div>
          ))}
          <p className="text-center text-xs text-white/25 pt-2">Showing {filteredEntries.length} of {data?.total ?? 0} trades</p>
        </motion.div>
      )}

      <TradeForm open={showForm} onClose={() => { setShowForm(false); setEditEntry(null); }} editEntry={editEntry} />
      <TradeDetail entry={selectedEntry} open={!!selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  );
}

function PremiumStat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur p-5">
      <p className={cn("font-display text-xl font-bold tabular-nums", tone === "good" && "text-emerald-300", tone === "bad" && "text-red-300", !tone && "text-white")}>{value}</p>
      <p className="mt-1 text-xs font-bold tracking-wide text-white/40">{label}</p>
      {sub && <p className="text-[11px] text-white/30 mt-1">{sub}</p>}
    </div>
  );
}
