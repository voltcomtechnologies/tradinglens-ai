"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Play,
  FileText,
  Award,
  Clock,
  Loader2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useCourses, useCourseProgress } from "@/lib/hooks/use-courses";

const levelConfig: Record<string, { badge: string; gradient: string }> = {
  beginner: {
    badge: "bg-emerald-500/10 text-emerald-400",
    gradient: "from-emerald-500/20 to-emerald-600/10",
  },
  intermediate: {
    badge: "bg-blue-500/10 text-blue-400",
    gradient: "from-blue-500/20 to-blue-600/10",
  },
  advanced: {
    badge: "bg-violet-500/10 text-violet-400",
    gradient: "from-violet-500/20 to-violet-600/10",
  },
  all: {
    badge: "bg-rose-500/10 text-rose-400",
    gradient: "from-rose-500/20 to-rose-600/10",
  },
};

export default function EduLensPage() {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: progressData, isLoading: progressLoading } = useCourseProgress();

  const isLoading = coursesLoading || progressLoading;

  // Calculate aggregate stats from real progress data
  const enrolledCourses = progressData?.length ?? 0;
  const completedModules =
    progressData?.filter((p) => p.isCompleted).length ?? 0;
  const totalTimeSpent =
    progressData?.reduce((sum, p) => sum + p.timeSpent, 0) ?? 0;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <BookOpen className="h-5 w-5 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold">Edu Lens</h1>
        </div>
        <p className="text-muted-foreground">
          Expert-led courses, interactive PDFs, and quizzes to accelerate your
          trading education.
        </p>
      </motion.div>

      {/* Progress overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Courses Enrolled",
            value: isLoading ? "—" : String(enrolledCourses),
            icon: BookOpen,
            color: "text-purple-400",
          },
          {
            label: "Modules Completed",
            value: isLoading ? "—" : String(completedModules),
            icon: Play,
            color: "text-emerald-400",
          },
          {
            label: "Quizzes Passed",
            value: "—",
            icon: Award,
            color: "text-amber-400",
          },
          {
            label: "Learning Hours",
            value: isLoading
              ? "—"
              : String(Math.round(totalTimeSpent / 60)),
            icon: Clock,
            color: "text-blue-400",
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

      {/* Course grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Courses</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course, i) => {
              const level = course.level.toLowerCase();
              const config = levelConfig[level] || levelConfig.beginner;
              const totalModules = course.modules.length;
              const totalDuration = course.modules.reduce(
                (sum, m) => sum + (m.duration ?? 0),
                0
              );
              const progress = progressData?.find(
                (p) => p.courseId === course.id
              );

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                >
                  <Link
                    href={`/dashboard/learn/${course.slug}`}
                    className="block group"
                  >
                    <div className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all duration-300">
                      <div
                        className={cn(
                          "h-32 bg-gradient-to-br flex items-center justify-center relative",
                          config.gradient
                        )}
                      >
                        <div className="p-3 rounded-xl bg-background/20 backdrop-blur-sm">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        {progress && (
                          <div className="absolute bottom-0 left-0 right-0 px-4 pb-2">
                            <Progress
                              value={progress.progressPct}
                              className="h-1 bg-white/20"
                            />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", config.badge)}
                          >
                            {course.level}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {course.category}
                          </span>
                        </div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {course.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            {totalModules} modules
                          </span>
                          {totalDuration > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {totalDuration} min
                            </span>
                          )}
                          {course._count && course._count.quizzes > 0 && (
                            <span className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              {course._count.quizzes} quizzes
                            </span>
                          )}
                        </div>
                        {progress && (
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                            <span className="text-xs text-muted-foreground">
                              {progress.progressPct}% complete
                            </span>
                            <span className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              Continue <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No courses available yet</h3>
            <p className="text-sm text-muted-foreground">
              Courses are being prepared. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
