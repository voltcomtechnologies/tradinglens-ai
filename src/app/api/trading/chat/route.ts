import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  const where: Record<string, unknown> = {
    userId: session.user.id,
    lensType: "trading",
  };
  if (sessionId) where.sessionId = sessionId;

  const messages = await prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(messages);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { role, content, sessionId, metadata } = body;

    const message = await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        sessionId: sessionId || crypto.randomUUID(),
        role: role || "user",
        content,
        lensType: "trading",
        metadata: metadata || undefined,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Failed to create chat message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 400 }
    );
  }
}
