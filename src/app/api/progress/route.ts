import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const progress = await prisma.courseProgress.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            level: true,
          },
        },
      },
      orderBy: { lastAccessed: "desc" },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Failed to fetch progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { courseId, moduleId, materialId, progressPct, isCompleted } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.courseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (existing) {
      const updated = await prisma.courseProgress.update({
        where: { id: existing.id },
        data: {
          moduleId: moduleId ?? existing.moduleId,
          materialId: materialId ?? existing.materialId,
          progressPct: progressPct ?? existing.progressPct,
          isCompleted: isCompleted ?? existing.isCompleted,
          completedAt: isCompleted ? new Date() : existing.completedAt,
          lastAccessed: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    const created = await prisma.courseProgress.create({
      data: {
        userId: session.user.id,
        courseId,
        moduleId,
        materialId,
        progressPct: progressPct ?? 0,
        isCompleted: isCompleted ?? false,
        completedAt: isCompleted ? new Date() : null,
        lastAccessed: new Date(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to update progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
