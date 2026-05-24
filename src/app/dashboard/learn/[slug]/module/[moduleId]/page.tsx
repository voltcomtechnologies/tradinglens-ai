import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CourseContent } from "./course-content";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string; moduleId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { slug, moduleId } = await params;

  const course = await prisma.course.findUnique({
    where: { slug, isPublished: true },
    include: {
      modules: {
        orderBy: { orderIndex: "asc" },
        include: {
          materials: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              title: true,
              fileUrl: true,
              pageCount: true,
              orderIndex: true,
            },
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

  const currentModule = course.modules.find((m) => m.id === moduleId);
  if (!currentModule) redirect(`/dashboard/learn/${slug}`);

  return (
    <CourseContent
      course={JSON.parse(JSON.stringify(course))}
      currentModule={JSON.parse(JSON.stringify(currentModule))}
      currentModuleIndex={course.modules.findIndex((m) => m.id === moduleId)}
      totalModules={course.modules.length}
    />
  );
}
