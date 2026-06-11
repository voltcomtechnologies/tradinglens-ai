"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface JournalEntry {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  lotSize: number | null;
  pips: number | null;
  profitLoss: number | null;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  strategy: string | null;
  notes: string | null;
  emotions: string | null;
  lessons: string | null;
  screenshot: string | null;
  entryDate: string;
  exitDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JournalStats {
  total: number;
  open: number;
  closed: number;
  cancelled: number;
  winning: number;
  losing: number;
  winRate: number;
  totalPips: number;
  totalProfitLoss: number;
  profitFactor: number;
  bestTrade: {
    pair: string;
    pips: number | null;
    profitLoss: number | null;
    strategy: string | null;
    date: string;
  } | null;
  worstTrade: {
    pair: string;
    pips: number | null;
    profitLoss: number | null;
    strategy: string | null;
    date: string;
  } | null;
  avgDuration: number | null;
  topPairs: { pair: string; count: number }[];
  monthlyPnL: { month: string; profitLoss: number; trades: number }[];
}

interface JournalFilters {
  status?: string;
  pair?: string;
  strategy?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CreateJournalData {
  pair: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  exitPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  lotSize?: number | null;
  pips?: number | null;
  profitLoss?: number | null;
  status?: string;
  strategy?: string | null;
  notes?: string | null;
  emotions?: string | null;
  lessons?: string | null;
  entryDate: string;
  exitDate?: string | null;
}

export function useJournalEntries(filters: JournalFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.pair) params.set("pair", filters.pair);
  if (filters.strategy) params.set("strategy", filters.strategy);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const qs = params.toString();

  return useQuery({
    queryKey: ["journal", filters],
    queryFn: async () => {
      const { data } = await axios.get<{
        entries: JournalEntry[];
        total: number;
        page: number;
        limit: number;
      }>(`/api/journal${qs ? `?${qs}` : ""}`);
      return data;
    },
  });
}

export function useJournalEntry(id: string | null) {
  return useQuery({
    queryKey: ["journal-entry", id],
    queryFn: async () => {
      const { data } = await axios.get<JournalEntry>(`/api/journal/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useJournalStats() {
  return useQuery({
    queryKey: ["journal-stats"],
    queryFn: async () => {
      const { data } = await axios.get<JournalStats>("/api/journal/stats");
      return data;
    },
    refetchInterval: 30000,
    meta: { showErrorToast: false },
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryData: CreateJournalData) => {
      const { data } = await axios.post<JournalEntry>(
        "/api/journal",
        entryData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      queryClient.invalidateQueries({ queryKey: ["journal-stats"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...entryData
    }: Partial<CreateJournalData> & { id: string }) => {
      const { data } = await axios.put<JournalEntry>(
        `/api/journal/${id}`,
        entryData
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entry", data.id] });
      queryClient.invalidateQueries({ queryKey: ["journal-stats"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/journal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      queryClient.invalidateQueries({ queryKey: ["journal-stats"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function getUniquePairs(
  entries: JournalEntry[] | undefined
): string[] {
  if (!entries) return [];
  return Array.from(new Set(entries.map((e) => e.pair))).sort();
}

export function getPipColor(pips: number | null): string {
  if (!pips || pips === 0) return "text-muted-foreground";
  return pips > 0 ? "text-emerald-400" : "text-red-400";
}
