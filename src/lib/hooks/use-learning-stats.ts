"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export type LearningStats = {
  enrolledCourses: number;
  modulesCompleted: number;
  quizzesPassed: number;
  learningMinutes: number;
};

export function useLearningStats() {
  return useQuery<LearningStats>({
    queryKey: ["learning-stats"],
    queryFn: async () => {
      const r = await axios.get<LearningStats>("/api/learning-stats");
      return r.data;
    },
    staleTime: 30 * 1000,
  });
}
