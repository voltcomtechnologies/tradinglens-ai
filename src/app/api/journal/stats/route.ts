import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TradingJournal } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const trades = await prisma.tradingJournal.findMany({
    where: { userId },
    orderBy: { entryDate: "desc" },
  });

  const total = trades.length;
  const open = trades.filter((t: TradingJournal) => t.status === "OPEN").length;
  const closed = trades.filter((t: TradingJournal) => t.status === "CLOSED").length;
  const cancelled = trades.filter((t: TradingJournal) => t.status === "CANCELLED").length;

  const closedTrades = trades.filter((t: TradingJournal) => t.status === "CLOSED");
  const winning = closedTrades.filter((t: TradingJournal) => (t.pips ?? 0) > 0).length;
  const losing = closedTrades.filter((t: TradingJournal) => (t.pips ?? 0) < 0).length;
  const winRate = closedTrades.length > 0 ? Math.round((winning / closedTrades.length) * 100) : 0;

  const totalPips = closedTrades.reduce((sum: number, t: TradingJournal) => sum + (t.pips ?? 0), 0);
  const totalProfitLoss = closedTrades.reduce(
    (sum: number, t: TradingJournal) => sum + (t.profitLoss ?? 0),
    0
  );

  const grossProfit = closedTrades
    .filter((t: TradingJournal) => (t.profitLoss ?? 0) > 0)
    .reduce((sum: number, t: TradingJournal) => sum + (t.profitLoss ?? 0), 0);
  const grossLoss = Math.abs(
    closedTrades
      .filter((t: TradingJournal) => (t.profitLoss ?? 0) < 0)
      .reduce((sum: number, t: TradingJournal) => sum + (t.profitLoss ?? 0), 0)
  );
  const profitFactor =
    grossLoss > 0
      ? Math.round((grossProfit / grossLoss) * 100) / 100
      : grossProfit > 0
        ? Infinity
        : 0;

  const bestTrade =
    closedTrades.length > 0
      ? closedTrades.reduce((best: TradingJournal, t: TradingJournal) =>
          (t.pips ?? 0) > (best.pips ?? 0) ? t : best
        )
      : null;
  const worstTrade =
    closedTrades.length > 0
      ? closedTrades.reduce((worst: TradingJournal, t: TradingJournal) =>
          (t.pips ?? 0) < (worst.pips ?? 0) ? t : worst
        )
      : null;

  let avgDuration: number | null = null;
  if (closedTrades.length > 0) {
    const durations = closedTrades
      .filter((t: TradingJournal) => t.exitDate)
      .map((t: TradingJournal) => t.exitDate!.getTime() - t.entryDate.getTime());
    if (durations.length > 0) {
      avgDuration = Math.round(
        durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length /
          (1000 * 60 * 60)
      );
    }
  }

  const pairCounts: Record<string, number> = {};
  trades.forEach((t: TradingJournal) => {
    pairCounts[t.pair] = (pairCounts[t.pair] || 0) + 1;
  });
  const topPairs = Object.entries(pairCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([pair, count]: [string, number]) => ({ pair, count }));

  const monthlyPnL: { month: string; profitLoss: number; trades: number }[] =
    [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthTrades = closedTrades.filter((t: TradingJournal) => {
      const entry = new Date(t.entryDate);
      return (
        entry.getMonth() === d.getMonth() &&
        entry.getFullYear() === d.getFullYear()
      );
    });
    monthlyPnL.push({
      month: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      profitLoss: monthTrades.reduce((s: number, t: TradingJournal) => s + (t.profitLoss ?? 0), 0),
      trades: monthTrades.length,
    });
  }

  return NextResponse.json({
    total,
    open,
    closed,
    cancelled,
    winning,
    losing,
    winRate,
    totalPips: Math.round(totalPips * 100) / 100,
    totalProfitLoss: Math.round(totalProfitLoss * 100) / 100,
    profitFactor,
    bestTrade: bestTrade
      ? {
          pair: bestTrade.pair,
          pips: bestTrade.pips,
          profitLoss: bestTrade.profitLoss,
          strategy: bestTrade.strategy,
          date: bestTrade.entryDate,
        }
      : null,
    worstTrade: worstTrade
      ? {
          pair: worstTrade.pair,
          pips: worstTrade.pips,
          profitLoss: worstTrade.profitLoss,
          strategy: worstTrade.strategy,
          date: worstTrade.entryDate,
        }
      : null,
    avgDuration,
    topPairs,
    monthlyPnL,
  });
}
