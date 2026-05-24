import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateLeaderboard } from "../route";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const entry = await prisma.tradingJournal.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.tradingJournal.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const wasPreviouslyOpen = existing.status === "OPEN";
    const isNowClosed = body.status === "CLOSED";

    const entry = await prisma.tradingJournal.update({
      where: { id },
      data: {
        pair: body.pair ?? existing.pair,
        direction: body.direction ?? existing.direction,
        entryPrice: body.entryPrice ?? existing.entryPrice,
        exitPrice: body.exitPrice !== undefined ? body.exitPrice : existing.exitPrice,
        stopLoss: body.stopLoss !== undefined ? body.stopLoss : existing.stopLoss,
        takeProfit: body.takeProfit !== undefined ? body.takeProfit : existing.takeProfit,
        lotSize: body.lotSize !== undefined ? body.lotSize : existing.lotSize,
        pips: body.pips !== undefined ? body.pips : existing.pips,
        profitLoss: body.profitLoss !== undefined ? body.profitLoss : existing.profitLoss,
        status: body.status ?? existing.status,
        strategy: body.strategy !== undefined ? body.strategy : existing.strategy,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        emotions: body.emotions !== undefined ? body.emotions : existing.emotions,
        lessons: body.lessons !== undefined ? body.lessons : existing.lessons,
        entryDate: body.entryDate ? new Date(body.entryDate) : existing.entryDate,
        exitDate: body.exitDate ? new Date(body.exitDate) : body.exitDate === null ? null : existing.exitDate,
        screenshot: body.screenshot !== undefined ? body.screenshot : existing.screenshot,
      },
    });

    if ((wasPreviouslyOpen && isNowClosed) || body.status === "CLOSED") {
      await updateLeaderboard(session.user.id);
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Failed to update journal entry:", error);
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.tradingJournal.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  await prisma.tradingJournal.delete({ where: { id } });

  await updateLeaderboard(session.user.id);

  return NextResponse.json({ success: true });
}
