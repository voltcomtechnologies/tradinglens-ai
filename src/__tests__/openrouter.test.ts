import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  classifyAnalysisType,
  buildTradingSystemPrompt,
  buildUserMessage,
} from "@/lib/openrouter";

// ─── classifyAnalysisType ──────────────────────────────────────────

describe("classifyAnalysisType", () => {
  it('returns "sentiment" when prompt contains "sentiment"', () => {
    expect(classifyAnalysisType("What is the market sentiment for EURUSD?")).toBe(
      "sentiment"
    );
  });

  it('returns "sentiment" when prompt contains "market feel"', () => {
    expect(classifyAnalysisType("Tell me the market feel for GBPUSD")).toBe(
      "sentiment"
    );
  });

  it('returns "levels" when prompt contains "support"', () => {
    expect(
      classifyAnalysisType("Find support and resistance levels for USDJPY")
    ).toBe("levels");
  });

  it('returns "levels" when prompt contains "resistance"', () => {
    expect(classifyAnalysisType("What is the resistance on EURUSD?")).toBe("levels");
  });

  it('returns "levels" when prompt contains "level"', () => {
    expect(classifyAnalysisType("Key levels for AUDUSD")).toBe("levels");
  });

  it('returns "opportunities" when prompt contains "opportunity"', () => {
    expect(classifyAnalysisType("Find trade opportunities")).toBe("opportunities");
  });

  it('returns "opportunities" when prompt contains "trade"', () => {
    expect(classifyAnalysisType("Give me a trade setup for GBPJPY")).toBe(
      "opportunities"
    );
  });

  it('returns "opportunities" when prompt contains "setup"', () => {
    expect(classifyAnalysisType("Best setups this week")).toBe("opportunities");
  });

  it('returns "analyze" for generic prompts', () => {
    expect(classifyAnalysisType("Tell me about EURUSD")).toBe("analyze");
  });

  it('returns "analyze" for empty string', () => {
    expect(classifyAnalysisType("")).toBe("analyze");
  });

  it("is case-insensitive", () => {
    expect(classifyAnalysisType("MARKET SENTIMENT analysis")).toBe("sentiment");
    expect(classifyAnalysisType("Support And Resistance")).toBe("levels");
  });
});

// ─── buildTradingSystemPrompt ──────────────────────────────────────

describe("buildTradingSystemPrompt", () => {
  it("includes the trading pair in the prompt", () => {
    const prompt = buildTradingSystemPrompt("analyze", "EURUSD", "1H");
    expect(prompt).toContain("EURUSD");
  });

  it("includes the timeframe in the prompt", () => {
    const prompt = buildTradingSystemPrompt("sentiment", "GBPUSD", "4H");
    expect(prompt).toContain("4H");
  });

  it("includes the base system instructions", () => {
    const prompt = buildTradingSystemPrompt("analyze", "EURUSD", "1D");
    expect(prompt).toContain("expert forex");
    expect(prompt).toContain("TradingLens AI");
  });

  it("includes the disclaimer", () => {
    const prompt = buildTradingSystemPrompt("levels", "USDJPY", "1H");
    expect(prompt).toContain("⚠️");
    expect(prompt).toContain("AI-generated analysis");
  });

  it('returns analysis-specific instructions for "analyze"', () => {
    const prompt = buildTradingSystemPrompt("analyze", "EURUSD", "1H");
    expect(prompt).toContain("full technical analysis");
    expect(prompt).toContain("RSI");
  });

  it('returns sentiment-specific instructions for "sentiment"', () => {
    const prompt = buildTradingSystemPrompt("sentiment", "EURUSD", "1H");
    expect(prompt).toContain("market sentiment");
    expect(prompt).toContain("retail vs institutional");
  });

  it('returns levels-specific instructions for "levels"', () => {
    const prompt = buildTradingSystemPrompt("levels", "EURUSD", "1H");
    expect(prompt).toContain("support and resistance");
    expect(prompt).toContain("order blocks");
  });

  it('returns opportunities-specific instructions for "opportunities"', () => {
    const prompt = buildTradingSystemPrompt("opportunities", "EURUSD", "1H");
    expect(prompt).toContain("trade opportunities");
    expect(prompt).toContain("risk/reward ratios");
  });

  it("includes today's date", () => {
    const prompt = buildTradingSystemPrompt("analyze", "EURUSD", "1H");
    const today = new Date().toISOString().split("T")[0];
    expect(prompt).toContain(today);
  });
});

// ─── buildUserMessage ──────────────────────────────────────────────

describe("buildUserMessage", () => {
  it("returns a simple text message when no image is provided", () => {
    const msg = buildUserMessage("Analyze EURUSD", null);
    expect(msg.role).toBe("user");
    expect(msg.content).toBe("Analyze EURUSD");
  });

  it("returns a simple text message when image is undefined", () => {
    const msg = buildUserMessage("Analyze EURUSD", undefined);
    expect(msg.role).toBe("user");
    expect(msg.content).toBe("Analyze EURUSD");
  });

  it("returns a multimodal message when an image data URL is provided", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
    const msg = buildUserMessage("Analyze this chart", dataUrl);

    expect(msg.role).toBe("user");
    expect(Array.isArray(msg.content)).toBe(true);

    const content = msg.content as Array<{ type: string }>;
    expect(content).toHaveLength(2);
    expect(content[0]).toEqual({ type: "text", text: "Analyze this chart" });
    expect(content[1]).toEqual({
      type: "image_url",
      image_url: { url: dataUrl, detail: "high" },
    });
  });

  it("uses 'high' detail for chart images", () => {
    const dataUrl = "data:image/jpeg;base64,abc123";
    const msg = buildUserMessage("Chart analysis", dataUrl);
    const content = msg.content as Array<{
      type: string;
      image_url?: { detail: string };
    }>;
    expect(content[1].image_url?.detail).toBe("high");
  });
});

// ─── chatCompletion ────────────────────────────────────────────────

// chatCompletion uses process.env.OPENROUTER_API_KEY and fetch,
// so we test it with mocked fetch only.

describe("chatCompletion", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-v1-test-key");
    vi.stubEnv("APP_URL", "https://test.example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("throws when OPENROUTER_API_KEY is not configured", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");

    // Need dynamic import because the module reads env at call time
    const { chatCompletion } = await import("@/lib/openrouter");

    await expect(
      chatCompletion([{ role: "user", content: "Hello" }])
    ).rejects.toThrow("OPENROUTER_API_KEY is not configured");
  });

  it("calls the OpenRouter API with correct headers and body", async () => {
    const mockResponse = {
      id: "chatcmpl-123",
      choices: [
        {
          message: { role: "assistant", content: "Hello! How can I help?" },
          finish_reason: "stop",
        },
      ],
      model: "openai/gpt-4o-mini",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { chatCompletion } = await import("@/lib/openrouter");

    const result = await chatCompletion([
      { role: "user", content: "Hello" },
    ]);

    expect(result).toBe("Hello! How can I help?");
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const url = fetchCall[0];
    const init = fetchCall[1];

    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect(init.headers["Authorization"]).toBe(
      "Bearer sk-or-v1-test-key"
    );
    expect(init.headers["HTTP-Referer"]).toBe("https://test.example.com");
    expect(init.headers["X-Title"]).toBe("TradingLens AI");

    const body = JSON.parse(init.body);
    expect(body.model).toBe("openai/gpt-4o-mini");
    expect(body.messages).toEqual([{ role: "user", content: "Hello" }]);
    expect(body.stream).toBe(false);
  });

  it("returns the content from the first choice", async () => {
    const mockResponse = {
      id: "chatcmpl-456",
      choices: [
        {
          message: {
            role: "assistant",
            content: "EURUSD is in an uptrend on the 1H timeframe.",
          },
          finish_reason: "stop",
        },
      ],
      model: "openai/gpt-4o-mini",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { chatCompletion } = await import("@/lib/openrouter");

    const result = await chatCompletion([
      { role: "user", content: "Analyze EURUSD" },
    ]);

    expect(result).toBe("EURUSD is in an uptrend on the 1H timeframe.");
  });

  it("throws on non-OK response", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('{"error":"Invalid API key"}'),
    });

    const { chatCompletion } = await import("@/lib/openrouter");

    await expect(
      chatCompletion([{ role: "user", content: "Hello" }])
    ).rejects.toThrow("OpenRouter API error 401");
  });

  it("throws on API error in response body", async () => {
    const errorResponse = {
      error: {
        code: "RATE_LIMITED",
        message: "You have exceeded your rate limit",
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(errorResponse),
    });

    const { chatCompletion } = await import("@/lib/openrouter");

    await expect(
      chatCompletion([{ role: "user", content: "Hello" }])
    ).rejects.toThrow("OpenRouter error RATE_LIMITED");
  });

  it("throws on empty response content", async () => {
    const emptyResponse = {
      id: "chatcmpl-789",
      choices: [
        {
          message: { role: "assistant", content: "" },
          finish_reason: "stop",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(emptyResponse),
    });

    const { chatCompletion } = await import("@/lib/openrouter");

    await expect(
      chatCompletion([{ role: "user", content: "Hello" }])
    ).rejects.toThrow("empty response");
  });

  it("handles missing choices array", async () => {
    const missingChoices = {
      id: "chatcmpl-000",
      choices: [],
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(missingChoices),
    });

    const { chatCompletion } = await import("@/lib/openrouter");

    await expect(
      chatCompletion([{ role: "user", content: "Hello" }])
    ).rejects.toThrow("empty response");
  });

  it("passes custom temperature and maxTokens options", async () => {
    const mockResponse = {
      id: "chatcmpl-custom",
      choices: [
        {
          message: { role: "assistant", content: "Analysis complete." },
          finish_reason: "stop",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { chatCompletion } = await import("@/lib/openrouter");

    await chatCompletion([{ role: "user", content: "Analyze" }], {
      temperature: 0.3,
      maxTokens: 512,
      model: "openai/gpt-4o",
    });

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.temperature).toBe(0.3);
    expect(body.max_tokens).toBe(512);
    expect(body.model).toBe("openai/gpt-4o");
  });

  it("sets AbortController signal with timeout", async () => {
    const mockResponse = {
      id: "chatcmpl-timeout",
      choices: [
        {
          message: { role: "assistant", content: "Fast response." },
          finish_reason: "stop",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { chatCompletion } = await import("@/lib/openrouter");

    await chatCompletion([{ role: "user", content: "Hello" }]);

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const init = fetchCall[1];
    expect(init.signal).toBeDefined();
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});
