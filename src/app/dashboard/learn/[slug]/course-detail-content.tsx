"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Play,
  FileText,
  Clock,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Lock,
  Award,
  ListTodo,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Module = {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  duration: number | null;
  materials: Array<{
    id: string;
    title: string;
    fileUrl: string;
    pageCount: number | null;
    orderIndex: number;
  }>;
};

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passScore: number;
};

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  level: string;
  category: string;
  modules: Module[];
  quizzes: Quiz[];
};

interface CourseDetailContentProps {
  course: Course;
  progress: { progressPct: number; isCompleted: boolean } | null;
}

const levelColors: Record<string, { badge: string; text: string; bg: string }> = {
  beginner: {
    badge: "bg-emerald-500/10 text-emerald-400",
    text: "text-emerald-400",
    bg: "from-emerald-500/20 to-emerald-600/10",
  },
  intermediate: {
    badge: "bg-blue-500/10 text-blue-400",
    text: "text-blue-400",
    bg: "from-blue-500/20 to-blue-600/10",
  },
  advanced: {
    badge: "bg-violet-500/10 text-violet-400",
    text: "text-violet-400",
    bg: "from-violet-500/20 to-violet-600/10",
  },
};

export function CourseDetailContent({ course, progress }: CourseDetailContentProps) {
  const colors = levelColors[course.level.toLowerCase()] || levelColors.beginner;
  const totalDuration = course.modules.reduce(
    (sum, m) => sum + (m.duration ?? 0),
    0
  );
  const totalMaterials = course.modules.reduce(
    (sum, m) => sum + m.materials.length,
    0
  );

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href="/dashboard/learn"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        Back to courses
      </Link>

      {/* Course Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-xl overflow-hidden"
      >
        <div className={cn("absolute inset-0 bg-gradient-to-br", colors.bg)} />
        <div className="relative p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn("text-xs", colors.badge)}>
                  {course.level}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {course.category}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold">{course.title}</h1>
              {course.description && (
                <p className="text-muted-foreground max-w-2xl">
                  {course.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Play className="h-4 w-4" />
                  {course.modules.length} modules
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  {totalMaterials} materials
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {totalDuration} min
                </span>
                {course.quizzes.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <ListTodo className="h-4 w-4" />
                    {course.quizzes.length} quizzes
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Your Progress</span>
                <span className={cn("font-medium", colors.text)}>
                  {progress.progressPct}%
                </span>
              </div>
              <Progress value={progress.progressPct} className="h-2" />
              {progress.isCompleted && (
                <div className="flex items-center gap-2 mt-3 text-emerald-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Course completed! 🎉
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Modules",
            value: course.modules.length,
            icon: BookOpen,
            color: colors.text,
          },
          {
            label: "Lessons",
            value: totalMaterials,
            icon: FileText,
            color: "text-blue-400",
          },
          {
            label: "Total Duration",
            value: `${totalDuration} min`,
            icon: Clock,
            color: "text-amber-400",
          },
          {
            label: "Quizzes",
            value: course.quizzes.length,
            icon: Award,
            color: "text-purple-400",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Modules List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-lg font-semibold mb-4">Course Modules</h2>
        <div className="space-y-3">
          {course.modules.map((module, i) => (
            <Link
              key={module.id}
              href={`/dashboard/learn/${course.slug}/module/${module.id}`}
              className="block group"
            >
              <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold",
                      colors.badge
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {module.title}
                    </h3>
                    {module.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {module.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {module.materials.length} materials
                      </span>
                      {module.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {module.duration} min
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors mt-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Quizzes Section */}
      {course.quizzes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-4">Course Quizzes</h2>
          <div className="space-y-3">
            {course.quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Trophy className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{quiz.title}</h3>
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {quiz.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {quiz.timeLimit && (
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {quiz.timeLimit} minutes
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          Pass: {quiz.passScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/dashboard/learn/${course.slug}/quiz/${quiz.id}`}>
                    <Button size="sm" variant="outline">
                      Start Quiz
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
