"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  buildOpenmaicClassroomUrl,
  estimatePromptBytes,
  MAX_OUTLINE_BYTES,
  type OpenmaicOutline,
} from "@/lib/openmaic";

export type UsageResponse = { limit: number; used: number };
export type TokenResponse = {
  token: string;
  expiresInSeconds: number;
  limit: number;
  used: number;
};

export function useOpenmaicUsage() {
  return useQuery<UsageResponse>({
    queryKey: ["openmaic-usage"],
    queryFn: async () => {
      const r = await axios.get<UsageResponse>("/api/openmaic-token");
      return r.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useLaunchAiclassroom() {
  return useMutation<{ url: string; used: number; limit: number }, Error, {
    outline: OpenmaicOutline | unknown;
    courseSlug?: string;
    courseId?: string;
  }>({
    mutationFn: async ({ outline, courseSlug, courseId }) => {
      // Pre-flight: refuse to mint a token for an outline whose rendered
      // requirement would blow past the OpenMAIC textarea. Prevents a
      // server roundtrip + audit row for a launch URL OpenMAIC will reject.
      const bytes = estimatePromptBytes(outline);
      if (bytes > MAX_OUTLINE_BYTES) {
        throw new Error(
          `Course outline is too large to launch (${bytes} > ${MAX_OUTLINE_BYTES} bytes; please contact an admin to trim the outline).`
        );
      }
      const tokenResp = await axios.post<TokenResponse>("/api/openmaic-token", {
        courseId,
      });
      const url = buildOpenmaicClassroomUrl({
        outline,
        token: tokenResp.data.token,
        courseSlug,
      });
      return { url, used: tokenResp.data.used, limit: tokenResp.data.limit };
    },
  });
}
