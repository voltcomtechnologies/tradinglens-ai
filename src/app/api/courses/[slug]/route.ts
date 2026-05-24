import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const course = await prisma.course.findUnique({
      where: { slug, isPublished: true },
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
        quizzes: {
          select: {
            id: true,
            title: true,
            description: true,
            timeLimit: true,
            passScore: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Failed to fetch course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}
