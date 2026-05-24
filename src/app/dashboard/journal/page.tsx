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
} from "lucide-react";
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

  const entries = data?.entries ?? [];
  const filteredEntries = useMemo(() => {
    let result = entries;
    if (strategyFilter) {
      result = result.filter((e: JournalEntry) => e.strategy === strategyFilter);
    }
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
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-rose-500/10">
              <ScrollText className="h-5 w-5 text-rose-400" />
            </div>
            <h1 className="text-2xl font-bold">Trading Journal</h1>
            {stats && (
              <Badge variant="outline" className="text-xs">
                {stats.total} trades
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Track, analyze, and improve every trade you take.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          New Entry
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4 animate-pulse"
              >
                <div className="h-7 w-20 bg-muted rounded mb-2" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Trades"
              value={String(stats.total)}
              sub={`${stats.open} open · ${stats.closed} closed`}
            />
            <StatCard
              label="Win Rate"
              value={`${stats.winRate}%`}
              sub={`${stats.winning}W / ${stats.losing}L`}
              positive={stats.winRate >= 50}
            />
            <StatCard
              label="Total Pips"
              value={`${stats.totalPips >= 0 ? "+" : ""}${stats.totalPips}`}
              sub={`Factor: ${stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}`}
              positive={stats.totalPips >= 0}
            />
            <StatCard
              label="Net P&L"
              value={`${stats.totalProfitLoss >= 0 ? "+" : ""}$${Math.abs(stats.totalProfitLoss).toLocaleString()}`}
              positive={stats.totalProfitLoss >= 0}
            />
          </div>
        ) : null}
      </motion.div>

      {stats?.monthlyPnL && stats.monthlyPnL.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Monthly Performance</span>
          </div>
          <div className="flex items-end gap-3 h-20">
            {stats.monthlyPnL.map((m: { month: string; profitLoss: number; trades: number }) => {
              const maxAbs = Math.max(
                ...stats.monthlyPnL.map((x: { profitLoss: number }) => Math.abs(x.profitLoss)),
                1
              );
              const height = Math.abs(m.profitLoss) / maxAbs;
              const isPositive = m.profitLoss >= 0;
              return (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="w-full flex flex-col items-center justify-end h-full">
                    <span className="text-[10px] font-medium tabular-nums">
                      {isPositive ? "+" : ""}${Math.abs(m.profitLoss).toFixed(0)}
                    </span>
                    <div
                      className={cn(
                        "w-full rounded-t-sm transition-all",
                        isPositive
                          ? "bg-emerald-500/60"
                          : "bg-red-500/60"
                      )}
                      style={{
                        height: `${Math.max(height * 100, 4)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">Filter</span>
          </div>
          <FilterChip
            active={!statusFilter}
            label="All"
            onClick={() => setStatusFilter("")}
          />
          <FilterChip
            active={statusFilter === "OPEN"}
            label="Open"
            onClick={() => setStatusFilter("OPEN")}
          />
          <FilterChip
            active={statusFilter === "CLOSED"}
            label="Closed"
            onClick={() => setStatusFilter("CLOSED")}
          />
          <FilterChip
            active={statusFilter === "CANCELLED"}
            label="Cancelled"
            onClick={() => setStatusFilter("CANCELLED")}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trades..."
              className="pl-10 h-9 text-sm"
            />
          </div>

          <select
            value={pairFilter}
            onChange={(e) => setPairFilter(e.target.value)}
            className="h-9 rounded-xl border border-border bg-card px-3 text-sm outline-none"
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
            className="h-9 rounded-xl border border-border bg-card px-3 text-sm outline-none"
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
            className="h-9 rounded-xl border border-border bg-card px-3 text-sm outline-none"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="pips_desc">Highest Pips</option>
            <option value="pips_asc">Lowest Pips</option>
            <option value="profit_desc">Best P&L</option>
          </select>

          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={() => refetch()}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted" />
                  <div>
                    <div className="h-5 w-24 bg-muted rounded mb-1" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-16 bg-muted rounded mb-1" />
                  <div className="h-3 w-12 bg-muted rounded" />
                </div>
              </div>
              <div className="h-3 w-3/4 bg-muted rounded" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="p-4 rounded-xl bg-red-500/10 inline-block mb-4">
            <TrendingDown className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to load trades</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Something went wrong. Please try again.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </motion.div>
      )}

      {!isLoading && !isError && filteredEntries.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="p-4 rounded-xl bg-muted inline-block mb-4">
            <ScrollText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || statusFilter || pairFilter
              ? "No matching trades"
              : "No trades yet"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
            {searchQuery || statusFilter || pairFilter
              ? "Try adjusting your filters to find what you're looking for."
              : "Start tracking your trading journey. Record your first trade to unlock insights and analytics."}
          </p>
          {!searchQuery && !statusFilter && !pairFilter && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Record First Trade
            </Button>
          )}
        </motion.div>
      )}

      {!isLoading && !isError && filteredEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {filteredEntries.map((entry: JournalEntry, i: number) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedEntry(entry)}
              className="rounded-xl border border-border bg-card p-4 lg:p-5 hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg shrink-0",
                      entry.direction === "BUY"
                        ? "bg-emerald-500/10"
                        : "bg-red-500/10"
                    )}
                  >
                    {entry.direction === "BUY" ? (
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{entry.pair}</span>
                      <Badge
                        variant={
                          entry.direction === "BUY" ? "default" : "destructive"
                        }
                        className="text-[10px] h-5 px-1.5"
                      >
                        {entry.direction}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-1.5 text-muted-foreground"
                      >
                        {entry.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.entryDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      getPipColor(entry.pips)
                    )}
                  >
                    {entry.pips != null
                      ? `${entry.pips >= 0 ? "+" : ""}${entry.pips}`
                      : "—"}
                  </p>
                  {entry.profitLoss != null && (
                    <p
                      className={cn(
                        "text-xs tabular-nums",
                        entry.profitLoss >= 0
                          ? "text-emerald-400/70"
                          : "text-red-400/70"
                      )}
                    >
                      {entry.profitLoss >= 0 ? "+" : ""}$
                      {entry.profitLoss.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {entry.strategy && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {entry.strategy}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  Entry: {entry.entryPrice.toFixed(5)}
                </span>
                {entry.exitPrice && (
                  <span className="text-[11px] text-muted-foreground">
                    Exit: {entry.exitPrice.toFixed(5)}
                  </span>
                )}
                {entry.lotSize && (
                  <span className="text-[11px] text-muted-foreground">
                    Lot: {entry.lotSize}
                  </span>
                )}
              </div>
              {entry.notes && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-1 group-hover:line-clamp-none transition-all">
                  {entry.notes}
                </p>
              )}
            </motion.div>
          ))}

          <p className="text-xs text-muted-foreground text-center pt-2">
            Showing {filteredEntries.length} of {data?.total ?? 0} trades
          </p>
        </motion.div>
      )}

      <TradeForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditEntry(null);
        }}
        editEntry={editEntry}
      />

      <TradeDetail
        entry={selectedEntry}
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p
        className={cn(
          "text-xl font-bold tabular-nums",
          positive === true && "text-emerald-400",
          positive === false && "text-red-400"
        )}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && (
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
