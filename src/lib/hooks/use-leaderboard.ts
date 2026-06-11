"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface LeaderboardEntry {
  rank: number;
  totalPips: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  streak: number;
  user: {
    name: string | null;
    avatar: string | null;
  };
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  currentUser: {
    rank: number;
    totalPips: number;
    winRate: number;
    totalTrades: number;
    profitFactor: number;
    streak: number;
  } | null;
  total: number;
}

export function useLeaderboard(period: string = "all", search: string = "") {
  const params = new URLSearchParams();
  if (period !== "all") params.set("period", period);
  if (search) params.set("search", search);

  const qs = params.toString();

  return useQuery({
    queryKey: ["leaderboard", period, search],
    queryFn: async () => {
      const { data } = await axios.get<LeaderboardResponse>(
        `/api/leaderboard${qs ? `?${qs}` : ""}`
      );
      return data;
    },
    refetchInterval: 60000,
    meta: { showErrorToast: false },
  });
}

export function getInitials(name: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatProfitFactor(pf: number): string {
  if (pf === Infinity) return "∞";
  return pf.toFixed(2);
}
