"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

export interface AnalysisResult {
  id: string;
  content: string;
  imageUrl: string | null;
  aiUsed?: boolean;
  providerName?: string | null;
  pair?: string;
  timeframe?: string;
  signal?: "buy" | "sell" | "hold";
  confidence?: number;
}

export interface ScanHistoryItem {
  id: string;
  imageUrl: string | null;
  pair: string;
  timeframe: string;
  analysisType: string;
  content: string;
  signal: "buy" | "sell" | "hold";
  confidence: number;
  createdAt: string;
}

export function useChatMessages(sessionId?: string) {
  const params = sessionId ? `?sessionId=${sessionId}` : "";
  return useQuery<ChatMessage[]>({
    queryKey: ["trading-chat", sessionId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/trading/chat${params}`);
      return data;
    },
    refetchInterval: 5000,
    meta: { showErrorToast: false },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      role: string;
      content: string;
      sessionId?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { data } = await axios.post("/api/trading/chat", params);
      return data as ChatMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading-chat"] });
    },
  });
}

export function useAnalyzeChart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      prompt?: string;
      pair?: string;
      timeframe?: string;
      image?: File;
    }) => {
      const formData = new FormData();
      if (params.prompt) formData.append("prompt", params.prompt);
      if (params.pair) formData.append("pair", params.pair);
      if (params.timeframe) formData.append("timeframe", params.timeframe);
      if (params.image) formData.append("image", params.image);

      const { data } = await axios.post<AnalysisResult>(
        "/api/trading/analyze",
        formData,
        {
          timeout: 60000,
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading-chat"] });
      queryClient.invalidateQueries({ queryKey: ["scan-history"] });
    },
  });
}

export function useScanHistory(enabled = true) {
  return useQuery<ScanHistoryItem[]>({
    queryKey: ["scan-history"],
    queryFn: async () => {
      const { data } = await axios.get<ScanHistoryItem[]>("/api/trading/analyze");
      return data;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    meta: { showErrorToast: false },
  });
}

export function useNotifications(unreadOnly = false) {
  const params = unreadOnly ? "?unreadOnly=true" : "";
  return useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: async () => {
      const { data } = await axios.get(`/api/notifications${params}`);
      return data as {
        notifications: Array<{
          id: string;
          title: string;
          message: string;
          type: string;
          isRead: boolean;
          link: string | null;
          createdAt: string;
        }>;
        unreadCount: number;
      };
    },
    refetchInterval: 30000,
    meta: { showErrorToast: false },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id?: string; markAllRead?: boolean }) => {
      const { data } = await axios.put("/api/notifications", params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
