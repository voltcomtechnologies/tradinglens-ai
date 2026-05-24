"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Trophy,
  Timer,
  AlertTriangle,
  ChevronLeft,
  Loader2,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSubmitQuizResult } from "@/lib/hooks/use-courses";

type Question = {
  id: string;
  type: "multiple-choice" | "single-choice" | "true-false";
  question: string;
  options: string[];
  correctAnswer: string | string[];
};

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
  timeLimit: number | null;
  passScore: number;
  course: {
    id: string;
    title: string;
    slug: string;
  };
};

type ExistingResult = {
  score: number;
  passed: boolean;
  timeTaken: number | null;
} | null;

interface QuizContentProps {
  quiz: Quiz;
  existingResult: ExistingResult;
}

export function QuizContent({ quiz, existingResult }: QuizContentProps) {
  const router = useRouter();
  const submitQuiz = useSubmitQuizResult(quiz.id);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const handleSubmitRef = useRef<() => Promise<void>>(async () => {});

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const timeTaken = quiz.timeLimit
        ? quiz.timeLimit * 60 - (timeLeft ?? 0)
        : undefined;

      const response = await submitQuiz.mutateAsync({
        answers,
        timeTaken,
      });

      setResult({
        score: response.score,
        passed: response.passed,
        correctAnswers: response.correctAnswers,
        totalQuestions: response.totalQuestions,
      });
      setShowResults(true);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    } finally {
      setIsSubmitting(false);
      setShowConfirmSubmit(false);
    }
  }, [answers, timeLeft, quiz.timeLimit, submitQuiz, isSubmitting]);

  // Keep ref updated with latest handleSubmit
  handleSubmitRef.current = handleSubmit;

  // Timer countdown - pure tick, no side effects in state updater
  useEffect(() => {
    if (timeLeft === null || showResults || existingResult) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, showResults, existingResult]);

  // Handle timeout separately (pure side effect, not inside state updater)
  useEffect(() => {
    if (timeLeft === 0 && !showResults && !existingResult && !isSubmitting) {
      handleSubmitRef.current();
    }
  }, [timeLeft, showResults, existingResult, isSubmitting]);

  const handleAnswer = useCallback(
    (questionId: string, answer: string | string[]) => {
      setAnswers((prev) => {
        const question = quiz.questions.find((q) => q.id === questionId);
        if (question?.type === "multiple-choice") {
          const current = (prev[questionId] as string[]) || [];
          const newAnswer = Array.isArray(answer)
            ? current.includes(answer[0])
              ? current.filter((a) => a !== answer[0])
              : [...current, answer[0]]
            : current.includes(answer)
              ? current.filter((a) => a !== answer)
              : [...current, answer];
          return { ...prev, [questionId]: newAnswer };
        }
        return { ...prev, [questionId]: answer };
      });
    },
    [quiz.questions]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // If user already took the quiz, show previous results
  if (existingResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-8 text-center"
        >
          <div className="p-4 rounded-full bg-amber-500/10 w-fit mx-auto mb-4">
            <Trophy className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Quiz Already Completed</h2>
          <p className="text-muted-foreground mb-6">
            You scored {existingResult.score}% —{" "}
            {existingResult.passed ? "Passed ✅" : "Did not pass"}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href={`/dashboard/learn/${quiz.course.slug}`}>
              <Button variant="outline" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Back to Course
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show results after submission
  if (showResults && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-border bg-card p-8 text-center"
        >
          <div
            className={cn(
              "p-4 rounded-full w-fit mx-auto mb-4",
              result.passed ? "bg-emerald-500/10" : "bg-red-500/10"
            )}
          >
            {result.passed ? (
              <Trophy className="h-8 w-8 text-emerald-400" />
            ) : (
              <XCircle className="h-8 w-8 text-red-400" />
            )}
          </div>
          <h2 className="text-xl font-bold mb-2">
            {result.passed ? "Congratulations! 🎉" : "Keep Learning! 💪"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {result.passed
              ? "You passed the quiz!"
              : "Don't give up, review the material and try again."}
          </p>

          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{result.score}%</p>
              <p className="text-xs text-muted-foreground">Your Score</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-400">
                {result.correctAnswers}/{result.totalQuestions}
              </p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-400">
                {quiz.passScore}%
              </p>
              <p className="text-xs text-muted-foreground">Pass Score</p>
            </div>
          </div>

          <Progress
            value={(result.correctAnswers / result.totalQuestions) * 100}
            className="h-2 mb-8"
          />

          <div className="flex items-center justify-center gap-4">
            <Link href={`/dashboard/learn/${quiz.course.slug}`}>
              <Button variant="outline" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Back to Course
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-4">
      {/* Back Link */}
      <Link
        href={`/dashboard/learn/${quiz.course.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {quiz.course.title}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-muted-foreground mt-1">{quiz.description}</p>
          )}
        </div>
        {timeLeft !== null && (
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium shrink-0",
              timeLeft < 60
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-border bg-card"
            )}
          >
            <Timer className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <Progress
          value={((currentQuestion + 1) / quiz.questions.length) * 100}
          className="h-1.5 flex-1"
        />
        <span className="text-xs text-muted-foreground shrink-0">
          {currentQuestion + 1} of {quiz.questions.length}
        </span>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <span
              className={cn(
                "px-2 py-0.5 rounded",
                "bg-primary/10 text-primary"
              )}
            >
              Question {currentQuestion + 1}
            </span>
            <span className="px-2 py-0.5 rounded bg-muted">
              {quiz.questions[currentQuestion].type
                .replace("-", " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          </div>

          <h3 className="text-lg font-medium mb-6">
            {quiz.questions[currentQuestion].question}
          </h3>

          <div className="space-y-3">
            {quiz.questions[currentQuestion].options.map((option, i) => {
              const questionId = quiz.questions[currentQuestion].id;
              const isMultiple =
                quiz.questions[currentQuestion].type === "multiple-choice";
              const currentAnswer = answers[questionId];
              const isSelected = isMultiple
                ? Array.isArray(currentAnswer) && currentAnswer.includes(option)
                : currentAnswer === option;

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(questionId, option)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors",
                      isMultiple ? "rounded-md" : "rounded-full",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    )}
                  >
                    {isSelected && (
                      <span className="text-xs font-bold">
                        {isMultiple ? "✓" : "●"}
                      </span>
                    )}
                  </div>
                  <span className="text-sm">{option}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
          disabled={currentQuestion === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {currentQuestion < quiz.questions.length - 1 ? (
            <Button
              onClick={() =>
                setCurrentQuestion((p) =>
                  Math.min(quiz.questions.length - 1, p + 1)
                )
              }
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Submit Quiz
            </Button>
          )}
        </div>
      </div>

      {/* Confirm Submit Dialog */}
      {showConfirmSubmit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="rounded-xl border border-border bg-card p-6 max-w-sm w-full shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold">Submit Quiz?</h3>
                <p className="text-sm text-muted-foreground">
                  You have answered {Object.keys(answers).length} of{" "}
                  {quiz.questions.length} questions.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmSubmit(false)}
              >
                Continue Reviewing
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
