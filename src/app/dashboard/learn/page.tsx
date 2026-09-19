"use client";

import { motion } from "framer-motion";
import { BookOpen, Play, Award, Clock, Loader2, ArrowRight, Sparkles, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useCourses, useCourseProgress } from "@/lib/hooks/use-courses";
import { useLearningStats } from "@/lib/hooks/use-learning-stats";

const levelConfig: Record<string, { badge: string; gradient: string; ring: string }> = {
  beginner: { badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20", gradient: "from-emerald-400/20 via-emerald-400/5 to-transparent", ring: "ring-emerald-400/20" },
  intermediate: { badge: "bg-accent/10 text-accent border-accent/20", gradient: "from-accent/20 via-accent/5 to-transparent", ring: "ring-accent/20" },
  advanced: { badge: "bg-violet-400/10 text-violet-300 border-violet-400/20", gradient: "from-violet-400/20 via-violet-400/5 to-transparent", ring: "ring-violet-400/20" },
  all: { badge: "bg-primary/10 text-primary border-primary/20", gradient: "from-primary/20 via-primary/5 to-transparent", ring: "ring-primary/20" },
};

export default function EduLensPage() {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: progressData, isLoading: progressLoading } = useCourseProgress();
  const { data: learningStats, isLoading: statsLoading } = useLearningStats();
  const isLoading = coursesLoading || progressLoading || statsLoading;

  const enrolledCourses = learningStats?.enrolledCourses ?? progressData?.length ?? 0;
  const completedModules = learningStats?.modulesCompleted ?? 0;
  const quizzesPassed = learningStats?.quizzesPassed ?? 0;
  const learningHours = Math.round((learningStats?.learningMinutes ?? 0) / 60);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-400/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-violet-300">
          <GraduationCap className="h-3.5 w-3.5" /> EDU LENS
        </div>
        <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">Learn. Practice. Compound.</h1>
        <p className="mt-1.5 text-sm text-white/45">Expert-led courses, interactive PDFs, and adaptive quizzes — built for real traders.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "Courses Enrolled", value: isLoading ? "—" : String(enrolledCourses), icon: BookOpen, tint: "border-violet-400/15 bg-violet-400/10 text-violet-300" },
          { label: "Modules Completed", value: isLoading ? "—" : String(completedModules), icon: Play, tint: "border-emerald-400/15 bg-emerald-400/10 text-emerald-300" },
          { label: "Quizzes Passed", value: isLoading ? "—" : String(quizzesPassed), icon: Award, tint: "border-primary/15 bg-primary/10 text-primary" },
          { label: "Learning Hours", value: isLoading ? "—" : String(learningHours), icon: Clock, tint: "border-accent/15 bg-accent/10 text-accent" },
        ].map((s) => (
          <div key={s.label} className="rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur p-5">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl border", s.tint)}>
              <s.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 font-display text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs font-bold tracking-wide text-white/35 mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-white">Available Courses</h2>
          <span className="text-xs text-white/30">{courses?.length ?? 0} courses</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 rounded-[20px] border border-white/10 bg-[#0b1428]/40">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course: any, i: number) => {
              const level = course.level.toLowerCase();
              const cfg = levelConfig[level] || levelConfig.beginner;
              const totalModules = course.modules.length;
              const totalDuration = course.modules.reduce((s: number, m: any) => s + (m.duration ?? 0), 0);
              const progress = progressData?.find((p: any) => p.courseId === course.id);
              return (
                <motion.div key={course.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.04 }}>
                  <Link href={`/dashboard/learn/${course.slug}`} className="block group">
                    <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur hover:border-primary/20 hover:bg-white/[0.04] transition-all">
                      <div className={cn("relative flex h-28 items-center justify-center bg-gradient-to-br", cfg.gradient)}>
                        <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] border backdrop-blur", cfg.badge)}>
                          <BookOpen className="h-6 w-6 text-white" />
                        </span>
                        {progress && (
                          <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
                            <Progress value={progress.progressPct} className="h-1 bg-white/10" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide", cfg.badge)}>{course.level}</span>
                          <span className="text-xs text-white/30">{course.category}</span>
                        </div>
                        <h3 className="font-display font-semibold text-white group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                        {course.description && <p className="mt-1 text-sm leading-6 text-white/45 line-clamp-2">{course.description}</p>}
                        <div className="mt-3 flex items-center gap-3 text-xs text-white/30">
                          <span className="inline-flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            {totalModules} modules
                          </span>
                          {totalDuration > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {totalDuration} min
                            </span>
                          )}
                          {course._count?.quizzes > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              {course._count.quizzes} quizzes
                            </span>
                          )}
                        </div>
                        {progress ? (
                          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                            <span className="text-xs font-bold text-white/50">{progress.progressPct}% complete</span>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                              Continue <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        ) : (
                          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            Start course <ArrowRight className="h-3 w-3" />
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
          <div className="text-center py-16 rounded-[20px] border border-white/10 bg-[#0b1428]/40">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/10">
              <BookOpen className="h-7 w-7 text-white/20" />
            </div>
            <h3 className="mt-4 font-display font-semibold text-white">No courses yet</h3>
            <p className="mt-1 text-sm text-white/40">Courses are being prepared. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
