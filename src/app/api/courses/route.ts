import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: {
        modules: {
          orderBy: { orderIndex: "asc" },
          include: {
            materials: {
              select: {
                id: true,
                title: true,
                fileUrl: true,
                pageCount: true,
                orderIndex: true,
              },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        _count: {
          select: { quizzes: true },
        },
      },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
