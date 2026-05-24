import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { QuizContent } from "./quiz-content";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ slug: string; quizId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { slug, quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      course: {
        select: { id: true, title: true, slug: true },
      },
    },
  });

  if (!quiz || quiz.course.slug !== slug) redirect("/dashboard/learn");

  // Check if user has already taken this quiz
  const existingResult = await prisma.quizResult.findFirst({
    where: {
      userId: session.user.id,
      quizId: quiz.id,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <QuizContent
      quiz={JSON.parse(JSON.stringify(quiz))}
      existingResult={
        existingResult
          ? JSON.parse(
              JSON.stringify({
                score: existingResult.score,
                passed: existingResult.passed,
                timeTaken: existingResult.timeTaken,
              })
            )
          : null
      }
    />
  );
}
