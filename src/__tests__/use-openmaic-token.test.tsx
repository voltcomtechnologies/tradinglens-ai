import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockAssign = vi.hoisted(() => vi.fn());

vi.mock("axios", async () => {
  const actual = await vi.importActual<typeof import("axios")>("axios");
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        get: vi.fn(),
        post: vi.fn(),
        interceptors: {
          response: {
            use: vi.fn((_onFulfilled, onRejected) => {
              (globalThis as any).__openmaicAxiosOnRejected = onRejected;
            }),
          },
        },
      })),
    },
  };
});

// Import the hook module so the axios instance and interceptor are created.
import axios from "axios";

// Import the hook module so the axios instance and interceptor are created.
import "@/lib/hooks/use-openmaic-token";

describe("use-openmaic-token 401 redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: { assign: mockAssign },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redirects to /auth/signin on a 401 response", async () => {
    const onRejected = (globalThis as any).__openmaicAxiosOnRejected;
    const error = new axios.AxiosError("Unauthorized");
    error.response = { status: 401 } as any;

    await expect(onRejected(error)).rejects.toEqual(error);
    expect(mockAssign).toHaveBeenCalledWith("/auth/signin");
  });

  it("does not redirect for non-401 errors", async () => {
    const onRejected = (globalThis as any).__openmaicAxiosOnRejected;
    const error = new axios.AxiosError("Server error");
    error.response = { status: 500 } as any;

    await expect(onRejected(error)).rejects.toEqual(error);
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it("does not redirect when the response has no status", async () => {
    const onRejected = (globalThis as any).__openmaicAxiosOnRejected;
    const error = new axios.AxiosError("Network error");

    await expect(onRejected(error)).rejects.toEqual(error);
    expect(mockAssign).not.toHaveBeenCalled();
  });
});
