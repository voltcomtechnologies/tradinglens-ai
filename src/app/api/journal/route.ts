import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const pair = searchParams.get("pair");
  const strategy = searchParams.get("strategy");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const sort = searchParams.get("sort") || "date_desc";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Prisma.TradingJournalWhereInput = { userId: session.user.id };

  if (status) where.status = status;
  if (pair) where.pair = pair;
  if (strategy) where.strategy = strategy;
  if (from || to) {
    where.entryDate = {};
    if (from) (where.entryDate as Record<string, unknown>).gte = new Date(from);
    if (to) (where.entryDate as Record<string, unknown>).lte = new Date(to);
  }

  const orderBy: Prisma.TradingJournalOrderByWithRelationInput =
    sort === "date_asc"
      ? { entryDate: "asc" }
      : sort === "pips_desc"
        ? { pips: "desc" }
        : sort === "pips_asc"
          ? { pips: "asc" }
          : sort === "profit_desc"
            ? { profitLoss: "desc" }
            : { entryDate: "desc" };

  const [entries, total] = await Promise.all([
    prisma.tradingJournal.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tradingJournal.count({ where }),
  ]);

  return NextResponse.json({ entries, total, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const entry = await prisma.tradingJournal.create({
      data: {
        userId: session.user.id,
        pair: body.pair,
        direction: body.direction,
        entryPrice: body.entryPrice,
        exitPrice: body.exitPrice ?? null,
        stopLoss: body.stopLoss ?? null,
        takeProfit: body.takeProfit ?? null,
        lotSize: body.lotSize ?? null,
        pips: body.pips ?? null,
        profitLoss: body.profitLoss ?? null,
        status: body.status ?? "OPEN",
        strategy: body.strategy ?? null,
        notes: body.notes ?? null,
        emotions: body.emotions ?? null,
        lessons: body.lessons ?? null,
        entryDate: new Date(body.entryDate),
        exitDate: body.exitDate ? new Date(body.exitDate) : null,
      },
    });

    if (body.status === "CLOSED") {
      await updateLeaderboard(session.user.id);
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Failed to create journal entry:", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 400 }
    );
  }
}

export async function updateLeaderboard(userId: string) {
  const trades = await prisma.tradingJournal.findMany({
    where: { userId, status: "CLOSED" },
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

  await prisma.leaderboardEntry.upsert({
    where: { userId },
    create: {
      userId,
      totalPips,
      winRate,
      totalTrades,
      profitFactor: isFinite(profitFactor) ? profitFactor : 0,
      streak,
      rank: 0,
    },
    update: {
      totalPips,
      winRate,
      totalTrades,
      profitFactor: isFinite(profitFactor) ? profitFactor : 0,
      streak,
    },
  });

  const allEntries = await prisma.leaderboardEntry.findMany({
    orderBy: { totalPips: "desc" },
  });
  await Promise.all(
    allEntries.map((entry, index) =>
      prisma.leaderboardEntry.update({
        where: { userId: entry.userId },
        data: { rank: index + 1 },
      })
    )
  );
}
