"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  FileText,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Module {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  duration: number | null;
  materials: Array<{
    id: string;
    title: string;
    fileUrl: string;
    orderIndex: number;
  }>;
}

interface CourseSidebarProps {
  modules: Module[];
  currentModuleId?: string;
  currentMaterialId?: string;
  onMaterialSelect: (moduleId: string, materialId: string) => void;
  completedModules?: string[];
}

export function CourseSidebar({
  modules,
  currentModuleId,
  currentMaterialId,
  onMaterialSelect,
  completedModules = [],
}: CourseSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    // Auto-expand current module
    if (currentModuleId) return new Set([currentModuleId]);
    return new Set([modules[0]?.id]);
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  return (
    <nav className="space-y-1">
      {modules.map((module) => {
        const isExpanded = expandedModules.has(module.id);
        const isCurrentModule = module.id === currentModuleId;
        const isCompleted = completedModules.includes(module.id);

        return (
          <div key={module.id}>
            <button
              onClick={() => toggleModule(module.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                isCurrentModule
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : isCurrentModule ? (
                <PlayCircle className="h-4 w-4 shrink-0" />
              ) : (
                <BookOpen className="h-4 w-4 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {module.orderIndex + 1}. {module.title}
                </p>
                {module.duration && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {module.duration} min
                  </p>
                )}
              </div>
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              )}
            </button>

            {isExpanded && module.materials.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-6 mt-1 space-y-1"
              >
                {module.materials.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => onMaterialSelect(module.id, material.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-sm",
                      material.id === currentMaterialId
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{material.title}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
