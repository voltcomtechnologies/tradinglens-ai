"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
  profile: {
    tradingStyle: string | null;
    experienceLevel: string | null;
    preferredPairs: string[];
    timezone: string | null;
    bio: string | null;
    phone: string | null;
    country: string | null;
    llmProvider: string | null;
  } | null;
}

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await axios.get("/api/settings/profile");
      return data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: Record<string, unknown>) => {
      const { data } = await axios.put("/api/settings/profile", profileData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data } = await axios.get("/api/subscription/plans");
      return data as Array<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        priceNGN: number;
        priceUSD: number;
        interval: string;
        features: string[];
        lensAccess: string[];
        isPopular: boolean;
      }>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserSubscription() {
  return useQuery({
    queryKey: ["user-subscription"],
    queryFn: async () => {
      const { data } = await axios.get("/api/subscription/user");
      return data as {
        id: string;
        status: string;
        startDate: string;
        endDate: string;
        autoRenew: boolean;
        plan: {
          id: string;
          name: string;
          slug: string;
          priceNGN: number;
          priceUSD: number;
          features: string[];
        };
        payments: Array<{
          id: string;
          amount: number;
          currency: string;
          status: string;
          createdAt: string;
        }>;
      } | null;
    },
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { data } = await axios.post("/api/subscription/user", { planId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await axios.put("/api/subscription/user", {
        action: "cancel",
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    },
  });
}

export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      subscriptionId: string;
      provider: string;
    }) => {
      const { data } = await axios.post("/api/subscription/initiate", params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });
}
