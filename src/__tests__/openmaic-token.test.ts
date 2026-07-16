import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Hoist the mock state so the `vi.mock` factories below can reference it.
const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  subscription: { findFirst: vi.fn() },
  course: { findUnique: vi.fn() },
  courseAiGeneration: { count: vi.fn(), create: vi.fn() },
}));

const mockAuth = vi.hoisted(() => vi.fn());
const mockSignOpenmaicToken = vi.hoisted(() =>
  vi.fn(() => ({
    token: "mock-token",
    expiresInSeconds: 600,
    expiresAt: Date.now() + 600_000,
  }))
);

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: mockAuth,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/openmaic-token", () => ({
  signOpenmaicToken: mockSignOpenmaicToken,
  OPENMAIC_TOKEN_TTL_SECONDS: 600,
}));

import { POST, GET } from "@/app/api/openmaic-token/route";

function makeRequest(body?: { courseId?: string }) {
  return new NextRequest("http://localhost:3000/api/openmaic-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("/api/openmaic-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("OPENMAIC_SHARED_SECRET", "a".repeat(64));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const res = await POST(makeRequest());
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 when the session user no longer exists in the database", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "stale-user-id", role: "USER" },
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const res = await POST(makeRequest());
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toMatch(/User not found/i);
      expect(mockPrisma.courseAiGeneration.create).not.toHaveBeenCalled();
    });

    it("returns 403 when the user has no active subscription", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-1", role: "USER" },
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "user-1", role: "USER" });
      mockPrisma.subscription.findFirst.mockResolvedValueOnce(null);

      const res = await POST(makeRequest());
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toMatch(/active subscription is required/i);
    });

    it("returns 404 when the course does not have AI Classroom enabled", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-1", role: "USER" },
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "user-1", role: "USER" });
      mockPrisma.subscription.findFirst.mockResolvedValueOnce({
        plan: { lensAccess: JSON.stringify(["edu"]) },
      });
      mockPrisma.course.findUnique.mockResolvedValueOnce({
        id: "course-1",
        slug: "intro",
        aiClassroomEnabled: false,
        aiClassroomOutline: null,
      });

      const res = await POST(makeRequest({ courseId: "course-1" }));
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toMatch(/does not have an AI Classroom/i);
    });

    it("returns 429 when the daily rate limit is reached", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-1", role: "USER" },
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "user-1", role: "USER" });
      mockPrisma.subscription.findFirst.mockResolvedValueOnce({
        plan: { lensAccess: JSON.stringify(["edu"]) },
      });
      mockPrisma.courseAiGeneration.count.mockResolvedValueOnce(5);

      const res = await POST(makeRequest());
      const data = await res.json();

      expect(res.status).toBe(429);
      expect(data.error).toMatch(/limit reached/i);
    });

    it("returns a token and creates an CourseAiGeneration audit row on success", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-1", role: "USER" },
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "user-1", role: "USER" });
      mockPrisma.subscription.findFirst.mockResolvedValueOnce({
        plan: { lensAccess: JSON.stringify(["edu"]) },
      });
      mockPrisma.courseAiGeneration.count.mockResolvedValueOnce(0);
      mockPrisma.courseAiGeneration.create.mockResolvedValueOnce({ id: "audit-1" });

      const res = await POST(makeRequest());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.token).toBe("mock-token");
      expect(data.limit).toBe(5);
      expect(data.used).toBe(1);
      expect(mockPrisma.courseAiGeneration.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          courseId: null,
          launched: false,
        },
      });
    });

    it("bypasses subscription checks for ADMIN users", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "admin-1", role: "ADMIN" },
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "admin-1", role: "ADMIN" });
      mockPrisma.courseAiGeneration.count.mockResolvedValueOnce(0);
      mockPrisma.courseAiGeneration.create.mockResolvedValueOnce({ id: "audit-1" });

      const res = await POST(makeRequest());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.token).toBe("mock-token");
      expect(mockPrisma.subscription.findFirst).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid JSON body", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-1", role: "USER" },
      });

      const req = new NextRequest("http://localhost:3000/api/openmaic-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toMatch(/Invalid JSON body/i);
    });
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 when the session user no longer exists in the database", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "stale-user-id", role: "USER" },
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toMatch(/User not found/i);
    });

    it("returns daily usage for an authenticated user", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-1", role: "USER" },
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "user-1", role: "USER" });
      mockPrisma.courseAiGeneration.count.mockResolvedValueOnce(2);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.limit).toBe(5);
      expect(data.used).toBe(2);
    });
  });
});
