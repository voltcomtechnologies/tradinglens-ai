"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export type CourseMaterial = {
  id: string;
  title: string;
  fileUrl: string;
  pageCount: number | null;
  orderIndex: number;
};

export type CourseModule = {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  duration: number | null;
  materials: CourseMaterial[];
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  level: string;
  category: string;
  isPublished: boolean;
  orderIndex: number;
  modules: CourseModule[];
  _count?: { quizzes: number };
};

export type CourseDetail = Course & {
  quizzes: Array<{
    id: string;
    title: string;
    description: string | null;
    timeLimit: number | null;
    passScore: number;
  }>;
};

export type CourseProgress = {
  id: string;
  userId: string;
  courseId: string;
  moduleId: string | null;
  materialId: string | null;
  progressPct: number;
  isCompleted: boolean;
  completedAt: string | null;
  lastAccessed: string;
  timeSpent: number;
  course: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
    level: string;
  };
};

export function useCourses() {
  return useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data } = await axios.get("/api/courses");
      return data;
    },
  });
}

export function useCourse(slug: string) {
  return useQuery<CourseDetail>({
    queryKey: ["course", slug],
    queryFn: async () => {
      const { data } = await axios.get(`/api/courses/${slug}`);
      return data;
    },
    enabled: !!slug,
  });
}

export function useCourseProgress() {
  return useQuery<CourseProgress[]>({
    queryKey: ["course-progress"],
    queryFn: async () => {
      const { data } = await axios.get("/api/progress");
      return data;
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      courseId: string;
      moduleId?: string;
      materialId?: string;
      progressPct?: number;
      isCompleted?: boolean;
    }) => {
      const { data } = await axios.post("/api/progress", params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-progress"] });
    },
  });
}

export type QuizResult = {
  result: {
    id: string;
    score: number;
    passed: boolean;
    timeTaken: number | null;
  };
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  passScore: number;
};

export function useSubmitQuizResult(quizId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      answers: Record<string, string | string[]>;
      timeTaken?: number;
    }) => {
      const { data } = await axios.post(`/api/quiz/${quizId}`, params);
      return data as QuizResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-results"] });
    },
  });
}
