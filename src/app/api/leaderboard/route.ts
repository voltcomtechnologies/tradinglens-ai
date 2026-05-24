import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all"; // all, monthly, weekly
  const search = searchParams.get("search") || "";

  const entries = await prisma.leaderboardEntry.findMany({
    orderBy: { rank: "asc" },
    include: {
      user: {
        select: {
          name: true,
          avatar: true,
        },
      },
    },
  });

  // Filter by time period if needed — recalculate from journal entries
  let filteredEntries = entries;
  if (period !== "all") {
    const now = new Date();
    let since: Date;
    if (period === "monthly") {
      since = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      since = new Date(now);
      since.setDate(since.getDate() - 7);
    }

    // Recalculate stats for each user in the given period
    const recalculated = await Promise.all(
      entries.map(async (entry) => {
        const trades = await prisma.tradingJournal.findMany({
          where: {
            userId: entry.userId,
            status: "CLOSED",
            exitDate: { gte: since },
          },
          select: { pips: true, profitLoss: true, exitDate: true },
        });

        const totalTrades = trades.length;
        const totalPips = trades.reduce((sum: number, t) => sum + (t.pips ?? 0), 0);
        const winningTrades = trades.filter((t) => (t.pips ?? 0) > 0).length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

        const grossProfit = trades
          .filter((t) => (t.profitLoss ?? 0) > 0)
          .reduce((sum: number, t) => sum + (t.profitLoss ?? 0), 0);
        const grossLoss = Math.abs(
          trades
            .filter((t) => (t.profitLoss ?? 0) < 0)
            .reduce((sum: number, t) => sum + (t.profitLoss ?? 0), 0)
        );
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

        const sorted = [...trades].sort(
          (a, b) => (b.exitDate?.getTime() ?? 0) - (a.exitDate?.getTime() ?? 0)
        );
        let streak = 0;
        for (const trade of sorted) {
          if ((trade.pips ?? 0) > 0) streak++;
          else break;
        }

        return {
          ...entry,
          totalPips,
          winRate,
          totalTrades,
          profitFactor: isFinite(profitFactor) ? profitFactor : 0,
          streak,
        };
      })
    );

    // Re-sort by totalPips and re-rank
    recalculated.sort((a, b) => b.totalPips - a.totalPips);
    filteredEntries = recalculated.map((e, i) => ({ ...e, rank: i + 1 }));
  }

  // Apply search filter
  if (search) {
    const lowerSearch = search.toLowerCase();
    filteredEntries = filteredEntries.filter((e) =>
      e.user.name?.toLowerCase().includes(lowerSearch)
    );
  }

  // Get current user's stats — prefer period-filtered, fall back to all-time
  const filteredUserEntry = filteredEntries.find((e) => e.userId === session.user.id);
  const allTimeEntry = entries.find((e) => e.userId === session.user.id);
  const currentUserEntry = filteredUserEntry ?? allTimeEntry;

  // Build response
  const responseEntries = filteredEntries.map((e) => ({
    rank: e.rank,
    totalPips: e.totalPips,
    winRate: e.winRate,
    totalTrades: e.totalTrades,
    profitFactor: e.profitFactor,
    streak: e.streak,
    user: {
      name: e.user.name,
      avatar: e.user.avatar,
    },
  }));

  return NextResponse.json({
    entries: responseEntries,
    currentUser: currentUserEntry
      ? {
          rank: currentUserEntry.rank,
          totalPips: currentUserEntry.totalPips,
          winRate: currentUserEntry.winRate,
          totalTrades: currentUserEntry.totalTrades,
          profitFactor: currentUserEntry.profitFactor,
          streak: currentUserEntry.streak,
        }
      : null,
    total: filteredEntries.length,
  });
}
