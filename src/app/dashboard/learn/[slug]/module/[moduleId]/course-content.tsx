"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  ChevronLeft,
  LayoutDashboard,
  ListTodo,
  Timer,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PDFViewer } from "@/components/learn/pdf-viewer";
import { CourseSidebar } from "@/components/learn/course-sidebar";
import { cn } from "@/lib/utils";
import { useUpdateProgress } from "@/lib/hooks/use-courses";

type Material = {
  id: string;
  title: string;
  fileUrl: string;
  pageCount: number | null;
  orderIndex: number;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  duration: number | null;
  materials: Material[];
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
  level: string;
  category: string;
  modules: Module[];
  quizzes: Quiz[];
};

interface CourseContentProps {
  course: Course;
  currentModule: Module;
  currentModuleIndex: number;
  totalModules: number;
}

export function CourseContent({
  course,
  currentModule,
  currentModuleIndex,
  totalModules,
}: CourseContentProps) {
  const router = useRouter();
  const updateProgress = useUpdateProgress();

  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    currentModule.materials[0]?.id ?? ""
  );

  const currentMaterial = currentModule.materials.find(
    (m) => m.id === selectedMaterial
  );

  const hasPrevious = currentModuleIndex > 0;
  const hasNext = currentModuleIndex < totalModules - 1;

  // Track initial material progress on mount
  useEffect(() => {
    const firstMaterial = currentModule.materials[0];
    if (firstMaterial) {
      updateProgress.mutate({
        courseId: course.id,
        moduleId: currentModule.id,
        materialId: firstMaterial.id,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMaterialSelect = useCallback(
    (moduleId: string, materialId: string) => {
      // Navigate to the module first, then select the material
      if (moduleId !== currentModule.id) {
        router.push(`/dashboard/learn/${course.slug}/module/${moduleId}`);
      } else {
        setSelectedMaterial(materialId);
        // Track progress
        updateProgress.mutate({
          courseId: course.id,
          moduleId,
          materialId,
        });
      }
    },
    [course.id, course.slug, currentModule.id, router, updateProgress]
  );

  const handleModuleComplete = useCallback(() => {
    updateProgress.mutate({
      courseId: course.id,
      moduleId: currentModule.id,
      progressPct: Math.round(((currentModuleIndex + 1) / totalModules) * 100),
      isCompleted: true,
    });
  }, [course.id, currentModule.id, currentModuleIndex, totalModules, updateProgress]);

  const handleNextModule = useCallback(() => {
    if (hasNext) {
      handleModuleComplete();
      router.push(
        `/dashboard/learn/${course.slug}/module/${course.modules[currentModuleIndex + 1].id}`
      );
    }
  }, [hasNext, handleModuleComplete, router, course, currentModuleIndex]);

  const materialIndex = currentModule.materials.findIndex(
    (m) => m.id === selectedMaterial
  );
  const hasPrevMaterial = materialIndex > 0;
  const hasNextMaterial = materialIndex < currentModule.materials.length - 1;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-8 h-14">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/learn/${course.slug}`}
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium truncate">
                {course.title}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/learn"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Back to courses"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 border-r border-border h-[calc(100vh-8.5rem)] overflow-y-auto p-4 sticky top-14">
          <CourseSidebar
            modules={course.modules}
            currentModuleId={currentModule.id}
            currentMaterialId={selectedMaterial}
            onMaterialSelect={handleMaterialSelect}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 p-4 lg:p-8 space-y-6">
          {/* Module Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>
                Module {currentModuleIndex + 1} of {totalModules}
              </span>
              {currentModule.duration && (
                <>
                  <span>•</span>
                  <span>{currentModule.duration} min</span>
                </>
              )}
            </div>
            <h1 className="text-xl lg:text-2xl font-bold">
              {currentModule.title}
            </h1>
            {currentModule.description && (
              <p className="text-muted-foreground mt-1">
                {currentModule.description}
              </p>
            )}
          </motion.div>

          {/* Material Navigation (if multiple materials) */}
          {currentModule.materials.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              {currentModule.materials.map((mat, i) => (
                <button
                  key={mat.id}
                  onClick={() => setSelectedMaterial(mat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    mat.id === selectedMaterial
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {i + 1}. {mat.title}
                </button>
              ))}
            </div>
          )}

          {/* PDF Viewer */}
          {currentMaterial && (
            <motion.div
              key={currentMaterial.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <PDFViewer
                fileUrl={currentMaterial.fileUrl}
                title={currentMaterial.title}
                pageCount={currentMaterial.pageCount}
              />
            </motion.div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {hasPrevious && (
                <Link
                  href={`/dashboard/learn/${course.slug}/module/${course.modules[currentModuleIndex - 1].id}`}
                >
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Previous Module
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasNext ? (
                <Button onClick={handleNextModule} className="gap-2">
                  Complete & Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Link href={`/dashboard/learn/${course.slug}`}>
                  <Button className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Course
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Course Quizzes Section */}
          {course.quizzes.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" />
                Course Quizzes
              </h2>
              <div className="space-y-3">
                {course.quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-start gap-3">
                      <Trophy className="h-5 w-5 text-amber-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{quiz.title}</p>
                        {quiz.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {quiz.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {quiz.timeLimit && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Timer className="h-3.5 w-3.5" />
                          {quiz.timeLimit} min
                        </span>
                      )}
                      <Link
                        href={`/dashboard/learn/${course.slug}/quiz/${quiz.id}`}
                      >
                        <Button size="sm" variant="outline">
                          Start Quiz
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
