import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CourseDetailContent } from "./course-detail-content";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

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

  if (!course) redirect("/dashboard/learn");

  // Get user's progress for this course
  const progress = await prisma.courseProgress.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: course.id,
      },
    },
  });

  return (
    <CourseDetailContent
      course={JSON.parse(JSON.stringify(course))}
      progress={
        progress
          ? JSON.parse(
              JSON.stringify({
                progressPct: progress.progressPct,
                isCompleted: progress.isCompleted,
              })
            )
          : null
      }
    />
  );
}
