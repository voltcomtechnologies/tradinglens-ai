import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Failed to fetch quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { answers, timeTaken } = body;

    if (!answers) {
      return NextResponse.json(
        { error: "Answers are required" },
        { status: 400 }
      );
    }

    // Fetch quiz to calculate score
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    // Calculate score by comparing answers
    const questions = quiz.questions as Array<{
      id: string;
      correctAnswer: string | string[];
    }>;
    let correctCount = 0;

    for (const question of questions) {
      const userAnswer = answers[question.id];
      if (!userAnswer) continue;

      if (Array.isArray(question.correctAnswer)) {
        // Multiple choice
        if (
          Array.isArray(userAnswer) &&
          question.correctAnswer.sort().join(",") ===
            [...userAnswer].sort().join(",")
        ) {
          correctCount++;
        }
      } else {
        // Single answer
        if (userAnswer === question.correctAnswer) {
          correctCount++;
        }
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= quiz.passScore;

    // Save result
    const result = await prisma.quizResult.create({
      data: {
        userId: session.user.id,
        quizId: id,
        score,
        answers: answers as any,
        passed,
        timeTaken: timeTaken ?? null,
      },
    });

    return NextResponse.json({
      result,
      score,
      passed,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      passScore: quiz.passScore,
    });
  } catch (error) {
    console.error("Failed to submit quiz:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
