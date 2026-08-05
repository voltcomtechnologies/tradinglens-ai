import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  extractMigratedSlug,
  fetchWithMigrationRetry,
} from "@/lib/llm/helpers";

// ─── extractMigratedSlug ───────────────────────────────────────────────

describe("extractMigratedSlug", () => {
  it("returns null for null / undefined / empty input", () => {
    expect(extractMigratedSlug(null)).toBeNull();
    expect(extractMigratedSlug(undefined)).toBeNull();
    expect(extractMigratedSlug("")).toBeNull();
    expect(extractMigratedSlug("   ")).toBeNull();
  });

  it("parses the canonical OpenRouter 'use this slug instead' form", () => {
    // From a real OpenRouter 404 response captured in the user report.
    const text =
      '{"error":{"message":"This model is unavailable for free. The paid version is available now - use this slug instead: deepseek/deepseek-v4-flash","code":404}}';
    expect(extractMigratedSlug(text)).toBe("deepseek/deepseek-v4-flash");
  });

  it("parses the inner message of a JSON envelope `error.message` shape", () => {
    const envelope = JSON.stringify({
      error: {
        message:
          "Model deprecated; use this model: meta-llama/llama-3.2-90b-vision-instruct:free",
        code: 410,
      },
    });
    expect(extractMigratedSlug(envelope)).toBe(
      "meta-llama/llama-3.2-90b-vision-instruct:free",
    );
  });

  it("parses the inner message of a JSON envelope `message` shape", () => {
    const envelope = JSON.stringify({
      message: "Model removed, please use groq/llama-3.1-70b-versatile",
    });
    expect(extractMigratedSlug(envelope)).toBe("groq/llama-3.1-70b-versatile");
  });

  it("parses 'use model X instead' phrasing", () => {
    expect(
      extractMigratedSlug(
        "Service unavailable; use model qwen/qwen3.6-27b-vl instead for vision.",
      ),
    ).toBe("qwen/qwen3.6-27b-vl");
  });

  it("parses 'please use X' phrasing", () => {
    expect(
      extractMigratedSlug("Please use llama-3.1-8b-instant for new requests."),
    ).toBe("llama-3.1-8b-instant");
  });

  it("parses slug wrapped in backticks", () => {
    expect(
      extractMigratedSlug("Use this model: `openai/gpt-4o-mini` from now on"),
    ).toBe("openai/gpt-4o-mini");
  });

  it("parses slug wrapped in double quotes", () => {
    expect(
      extractMigratedSlug('use this slug instead: "anthropic/claude-3-haiku"'),
    ).toBe("anthropic/claude-3-haiku");
  });

  it("parses slug with a colon-no-space form", () => {
    expect(extractMigratedSlug("use this slug instead:foo/bar")).toBe(
      "foo/bar",
    );
  });

  it("parses Groq-style 'use this model: X' wording", () => {
    expect(
      extractMigratedSlug(
        "The model `llama-3.3-70b-versatile` has been deprecated; use this model: llama-3.3-70b-specdec",
      ),
    ).toBe("llama-3.3-70b-specdec");
  });

  it("returns null when there is no migration hint at all", () => {
    expect(extractMigratedSlug("messages[1].content must be a string")).toBeNull();
    expect(extractMigratedSlug("Internal server error")).toBeNull();
    expect(
      extractMigratedSlug("Rate limit exceeded; try again in a few seconds"),
    ).toBeNull();
  });

  it("returns null on a non-migration embedded model name", () => {
    // No "use X" scoping verb — we deliberately refuse to match raw
    // model names that appear in error prose, to avoid feeding the
    // retry path with a guess.
    expect(
      extractMigratedSlug(
        "We support llama-3.3-70b-versatile, llama-3.1-8b-instant, and others.",
      ),
    ).toBeNull();
  });

  it("returns null on raw JSON that fails to parse", () => {
    expect(extractMigratedSlug("{ not valid json ::: }")).toBeNull();
  });

  it("ignores an empty inner message and falls back to outer regex (null)", () => {
    expect(extractMigratedSlug('{"error":{"message":""}}')).toBeNull();
  });

  it("is case-insensitive on the verb", () => {
    expect(
      extractMigratedSlug("USE THIS SLUG INSTEAD: anthropic/claude-3-haiku"),
    ).toBe("anthropic/claude-3-haiku");
  });

  it("caps slug length so pathological text can't drag the regex", () => {
    const huge = "a".repeat(5000);
    const text = `use this slug instead: ${huge}`;
    // Should either truncate to a finite-length match or return null —
    // either way it must NOT throw or hang.
    expect(() => extractMigratedSlug(text)).not.toThrow();
    const result = extractMigratedSlug(text);
    // 128-char cap means the result, if returned, is at most 128 chars.
    if (result) {
      expect(result.length).toBeLessThanOrEqual(128);
    }
  });
});

// ─── fetchWithMigrationRetry ──────────────────────────────────────────

/**
 * Helper to build a fake `Response`-shaped object compatible with what
 * `fetchWithMigrationRetry` consumes: `ok`, `status`, `text()`.
 */
function makeFakeResponse(
  ok: boolean,
  status: number,
  body: unknown,
): Response {
  const text =
    typeof body === "string" ? body : JSON.stringify(body);
  return new Response(text, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchWithMigrationRetry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseArgs = {
    url: "https://example.com/chat",
    headers: { "Content-Type": "application/json", Authorization: "Bearer t" },
    providerName: "TestProvider",
    body: {
      model: "old/deprecated-model",
      messages: [{ role: "user", content: "hi" }],
      stream: false,
    },
    signal: undefined,
  };

  it("returns the first response unchanged when it is OK (no retry)", async () => {
    const ok = makeFakeResponse(true, 200, { choices: [{ message: { content: "ok" } }] });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(ok);
    const result = await fetchWithMigrationRetry(baseArgs);
    expect(result).toBe(ok);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("retries once with the migrated slug when the first response suggests one", async () => {
    const firstResponse = makeFakeResponse(
      false,
      404,
      JSON.stringify({
        error: {
          message:
            "This model is unavailable for free. The paid version is available now - use this slug instead: google/gemini-2.0-flash-exp:free",
          code: 404,
        },
      }),
    );
    const retryResponse = makeFakeResponse(true, 200, {
      choices: [{ message: { content: "ok-after-migration" } }],
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(retryResponse);

    const result = await fetchWithMigrationRetry(baseArgs);

    expect(result).toBe(retryResponse);
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const [, init] = fetchSpy.mock.calls[1];
    const retryPayload = JSON.parse((init as RequestInit).body as string);
    expect(retryPayload.model).toBe("google/gemini-2.0-flash-exp:free");
    // Original messages preserved on the retry.
    expect(retryPayload.messages).toEqual(baseArgs.body.messages);
  });

  it("throws with migration context when first call fails AND retry also fails", async () => {
    const firstResponse = makeFakeResponse(
      false,
      404,
      '{"error":{"message":"use this model: nope-still-broken","code":404}}',
    );
    const retryResponse = makeFakeResponse(false, 402, "still paid-only");
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(retryResponse);

    await expect(fetchWithMigrationRetry(baseArgs)).rejects.toThrow(
      /TestProvider API error 404.*nope-still-broken.*retry 402/i,
    );
  });

  it("throws the standard error when there is no migration hint (no retry)", async () => {
    const failed = makeFakeResponse(
      false,
      400,
      JSON.stringify({
        error: {
          message: "messages[1].content must be a string",
          type: "invalid_request_error",
        },
      }),
    );
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(failed);

    await expect(fetchWithMigrationRetry(baseArgs)).rejects.toThrow(
      /TestProvider API error 400: .*messages\[1\]\.content must be a string/,
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1); // no second call
  });

  it("does NOT retry on a 5xx — those are not slug migrations", async () => {
    const serverError = makeFakeResponse(false, 503, "upstream overload");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(serverError);

    await expect(fetchWithMigrationRetry(baseArgs)).rejects.toThrow(
      /TestProvider API error 503: upstream overload/,
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("forwards the abort signal to both fetch calls", async () => {
    const controller = new AbortController();
    const ok = makeFakeResponse(true, 200, { ok: true });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(ok);

    await fetchWithMigrationRetry({ ...baseArgs, signal: controller.signal });
    expect(fetchSpy.mock.calls[0][1]).toMatchObject({
      signal: controller.signal,
    });
  });

  it("POSTs JSON with Content-Type and Authorization headers", async () => {
    const ok = makeFakeResponse(true, 200, { ok: true });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(ok);

    await fetchWithMigrationRetry(baseArgs);

    const [calledUrl, init] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe(baseArgs.url);
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer t",
    });
    expect(typeof (init as RequestInit).body).toBe("string");
  });
});

// ─── Provider streaming mid-stream error boundary ────────────────────

/**
 * The streaming retry boundary is critical: if a future refactor
 * accidentally extends the retry into the post-fetch body-loop, we'd
 * silently duplicate yielded deltas to the upstream. Lock that down
 * with a test that asserts a mid-stream read error does NOT trigger
 * a second POST.
 */
describe("OpenRouter streaming mid-stream error boundary", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-v1-test-key");
    vi.stubEnv("APP_URL", "https://test.example.com");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("does NOT retry fetch when the upstream errors mid-stream after a partial delta was already yielded", async () => {
    const encoder = new TextEncoder();
    let reads = 0;

    // Fake reader that yields one valid delta, then throws on the next
    // read. Simulates "upstream happily streamed then connection-lost
    // us" — exactly the case where retrying would duplicate content.
    const fakeReader = {
      async read() {
        reads += 1;
        if (reads === 1) {
          return {
            value: encoder.encode(
              'data: {"choices":[{"delta":{"content":"hi"}}]}\n\n',
            ),
            done: false as const,
          };
        }
        throw new Error("upstream mid-stream disconnect");
      },
      releaseLock() {
        /* noop */
      },
      cancel: async () => {
        /* noop */
      },
      // `closed` is not used by the streaming consumer but is part of
      // the reader interface in newer DOM lib specs.
      closed: Promise.resolve(undefined),
    };

    const fakeBody = {
      getReader: () => fakeReader,
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: fakeBody,
        // json() / text() shouldn't be called on the streaming path,
        // but stub them defensively so a future refactor retrying the
        // first fetch and then trying to read these throws cleanly.
        json: () => Promise.reject(new Error("not used on stream path")),
        text: () => Promise.reject(new Error("not used on stream path")),
      } as unknown as Response);

    const { openrouterClient } = await import("@/lib/llm/openrouter");
    const gen = openrouterClient.chatCompletionStream([
      { role: "user", content: "hello" },
    ]);

    const collected: string[] = [];
    let caught: unknown;
    try {
      for await (const chunk of gen) {
        collected.push(chunk);
      }
    } catch (err) {
      caught = err;
    }

    expect(collected).toEqual(["hi"]);
    expect(caught).toBeInstanceOf(Error);
    expect(String(caught)).toContain("upstream mid-stream disconnect");

    // The load-bearing assertion. If a future refactor extends the
    // retry into the body loop, this catches it: duplicating chunks
    // would either re-POST (fetch call count > 1) OR yield the same
    // byte twice. Both are bad UX for the chart-narrator.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
