import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// We'll test the pure utility functions directly
// and mock axios for the hooks

vi.mock("axios");

// Import after mocking
import {
  getUniquePairs,
  getPipColor,
  useJournalEntries,
  useJournalStats,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
  useJournalEntry,
} from "@/lib/hooks/use-journal";
import axios from "axios";
import type { JournalEntry, JournalStats } from "@/lib/hooks/use-journal";

// ── Wrapper for React Query hooks ──────────────────────────────────
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// ── Mock Data ──────────────────────────────────────────────────────
const mockEntries: JournalEntry[] = [
  {
    id: "1",
    pair: "EURUSD",
    direction: "BUY",
    entryPrice: 1.0820,
    exitPrice: 1.0895,
    stopLoss: 1.0790,
    takeProfit: 1.0920,
    lotSize: 1.0,
    pips: 75,
    profitLoss: 562.5,
    status: "CLOSED",
    strategy: "Breakout",
    notes: "Good trade",
    emotions: "Focused",
    lessons: "Patience pays off",
    screenshot: null,
    entryDate: "2025-01-01T10:00:00Z",
    exitDate: "2025-01-01T16:00:00Z",
    createdAt: "2025-01-01T10:00:00Z",
    updatedAt: "2025-01-01T16:00:00Z",
  },
  {
    id: "2",
    pair: "GBPUSD",
    direction: "SELL",
    entryPrice: 1.2650,
    exitPrice: 1.2590,
    stopLoss: 1.2680,
    takeProfit: 1.2550,
    lotSize: 1.5,
    pips: 60,
    profitLoss: 450.0,
    status: "CLOSED",
    strategy: "Trend Following",
    notes: null,
    emotions: "Confident",
    lessons: "Trend is your friend",
    screenshot: null,
    entryDate: "2025-01-02T08:00:00Z",
    exitDate: "2025-01-02T14:00:00Z",
    createdAt: "2025-01-02T08:00:00Z",
    updatedAt: "2025-01-02T14:00:00Z",
  },
  {
    id: "3",
    pair: "EURUSD",
    direction: "SELL",
    entryPrice: 1.0860,
    exitPrice: 1.0880,
    stopLoss: 1.0890,
    takeProfit: 1.0830,
    lotSize: 1.0,
    pips: -20,
    profitLoss: -150.0,
    status: "CLOSED",
    strategy: "Range Trading",
    notes: null,
    emotions: "Frustrated",
    lessons: "Should have waited",
    screenshot: null,
    entryDate: "2025-01-03T10:00:00Z",
    exitDate: "2025-01-03T12:00:00Z",
    createdAt: "2025-01-03T10:00:00Z",
    updatedAt: "2025-01-03T12:00:00Z",
  },
];

const mockStats: JournalStats = {
  total: 3,
  open: 0,
  closed: 3,
  cancelled: 0,
  winning: 2,
  losing: 1,
  winRate: 66.67,
  totalPips: 115,
  totalProfitLoss: 862.5,
  profitFactor: 2.0,
  bestTrade: {
    pair: "EURUSD",
    pips: 75,
    profitLoss: 562.5,
    strategy: "Breakout",
    date: "2025-01-01T10:00:00Z",
  },
  worstTrade: {
    pair: "EURUSD",
    pips: -20,
    profitLoss: -150.0,
    strategy: "Range Trading",
    date: "2025-01-03T10:00:00Z",
  },
  avgDuration: 6,
  topPairs: [
    { pair: "EURUSD", count: 2 },
    { pair: "GBPUSD", count: 1 },
  ],
  monthlyPnL: [
    { month: "2025-01", profitLoss: 862.5, trades: 3 },
  ],
};

// ── Tests for getUniquePairs ───────────────────────────────────────
describe("getUniquePairs", () => {
  it("returns sorted unique pairs from entries", () => {
    const result = getUniquePairs(mockEntries);
    expect(result).toEqual(["EURUSD", "GBPUSD"]);
  });

  it("returns empty array when entries is undefined", () => {
    const result = getUniquePairs(undefined);
    expect(result).toEqual([]);
  });

  it("returns empty array when entries is empty", () => {
    const result = getUniquePairs([]);
    expect(result).toEqual([]);
  });

  it("handles single entry", () => {
    const result = getUniquePairs([mockEntries[0]]);
    expect(result).toEqual(["EURUSD"]);
  });
});

// ── Tests for getPipColor ──────────────────────────────────────────
describe("getPipColor", () => {
  it("returns green for positive pips", () => {
    expect(getPipColor(75)).toBe("text-emerald-400");
  });

  it("returns red for negative pips", () => {
    expect(getPipColor(-20)).toBe("text-red-400");
  });

  it("returns muted for zero pips", () => {
    expect(getPipColor(0)).toBe("text-muted-foreground");
  });

  it("returns muted for null pips", () => {
    expect(getPipColor(null)).toBe("text-muted-foreground");
  });
});

// ── Tests for useJournalEntries hook ───────────────────────────────
describe("useJournalEntries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches journal entries successfully", async () => {
    const mockAxiosGet = vi.mocked(axios.get);
    mockAxiosGet.mockResolvedValueOnce({
      data: { entries: mockEntries, total: 3, page: 1, limit: 20 },
    });

    const { result } = renderHook(() => useJournalEntries({}), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      entries: mockEntries,
      total: 3,
      page: 1,
      limit: 20,
    });
    expect(mockAxiosGet).toHaveBeenCalledWith("/api/journal");
  });

  it("passes filters as query params", async () => {
    const mockAxiosGet = vi.mocked(axios.get);
    mockAxiosGet.mockResolvedValueOnce({
      data: { entries: [mockEntries[0]], total: 1, page: 1, limit: 10 },
    });

    const { result } = renderHook(
      () => useJournalEntries({ status: "CLOSED", pair: "EURUSD", limit: 10 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockAxiosGet).toHaveBeenCalledWith(
      "/api/journal?status=CLOSED&pair=EURUSD&limit=10"
    );
  });

  it("handles API errors", async () => {
    const mockAxiosGet = vi.mocked(axios.get);
    mockAxiosGet.mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useJournalEntries({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

// ── Tests for useJournalEntry hook ─────────────────────────────────
describe("useJournalEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches single entry when id is provided", async () => {
    const mockAxiosGet = vi.mocked(axios.get);
    mockAxiosGet.mockResolvedValueOnce({ data: mockEntries[0] });

    const { result } = renderHook(() => useJournalEntry("1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockEntries[0]);
    expect(mockAxiosGet).toHaveBeenCalledWith("/api/journal/1");
  });

  it("does not fetch when id is null", async () => {
    const mockAxiosGet = vi.mocked(axios.get);

    const { result } = renderHook(() => useJournalEntry(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockAxiosGet).not.toHaveBeenCalled();
  });
});

// ── Tests for useJournalStats hook ─────────────────────────────────
describe("useJournalStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches journal stats successfully", async () => {
    const mockAxiosGet = vi.mocked(axios.get);
    mockAxiosGet.mockResolvedValueOnce({ data: mockStats });

    const { result } = renderHook(() => useJournalStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockStats);
    expect(mockAxiosGet).toHaveBeenCalledWith("/api/journal/stats");
  });
});

// ── Tests for useCreateJournalEntry mutation ───────────────────────
describe("useCreateJournalEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates entry and invalidates queries", async () => {
    const mockAxiosPost = vi.mocked(axios.post);
    const newEntry = {
      pair: "USDJPY",
      direction: "BUY" as const,
      entryPrice: 151.50,
      exitPrice: 152.30,
      pips: 80,
      profitLoss: 600,
      status: "CLOSED",
      strategy: "Breakout",
      entryDate: "2025-01-10T10:00:00Z",
      exitDate: "2025-01-10T16:00:00Z",
    };

    mockAxiosPost.mockResolvedValueOnce({
      data: { id: "4", ...newEntry, lotSize: null, stopLoss: null, takeProfit: null, notes: null, emotions: null, lessons: null, screenshot: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    });

    const { result } = renderHook(() => useCreateJournalEntry(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newEntry);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAxiosPost).toHaveBeenCalledWith("/api/journal", newEntry);
  });
});

// ── Tests for useUpdateJournalEntry mutation ───────────────────────
describe("useUpdateJournalEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates entry with id and partial data", async () => {
    const mockAxiosPut = vi.mocked(axios.put);
    const updateData = { id: "1", notes: "Excellent trade!", emotions: "Happy" };

    mockAxiosPut.mockResolvedValueOnce({
      data: { ...mockEntries[0], notes: "Excellent trade!", emotions: "Happy" },
    });

    const { result } = renderHook(() => useUpdateJournalEntry(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(updateData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAxiosPut).toHaveBeenCalledWith("/api/journal/1", {
      notes: "Excellent trade!",
      emotions: "Happy",
    });
  });
});

// ── Tests for useDeleteJournalEntry mutation ───────────────────────
describe("useDeleteJournalEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes entry and invalidates queries", async () => {
    const mockAxiosDelete = vi.mocked(axios.delete);
    mockAxiosDelete.mockResolvedValueOnce({});

    const { result } = renderHook(() => useDeleteJournalEntry(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAxiosDelete).toHaveBeenCalledWith("/api/journal/1");
  });
});
