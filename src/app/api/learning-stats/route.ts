import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Enrolled courses: distinct courseIds the user has any CourseProgress row for.
  // Quizzes passed: count QuizResult with passed=true.
  // Modules completed: count CourseProgress with isCompleted=true.
  // Learning hours: sum CourseProgress.timeSpent.
  const [progress, quizzesPassed, modulesCompleted, timeAgg] = await Promise.all([
    prisma.courseProgress.findMany({
      where: { userId },
      select: { courseId: true, timeSpent: true },
    }),
    prisma.quizResult.count({ where: { userId, passed: true } }),
    prisma.courseProgress.count({ where: { userId, isCompleted: true } }),
    prisma.courseProgress.aggregate({
      where: { userId },
      _sum: { timeSpent: true },
    }),
  ]);

  return NextResponse.json({
    enrolledCourses: new Set(progress.map((p) => p.courseId)).size,
    modulesCompleted,
    quizzesPassed,
    learningMinutes: timeAgg._sum.timeSpent ?? 0,
  });
}
