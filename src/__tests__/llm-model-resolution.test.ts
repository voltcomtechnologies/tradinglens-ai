import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { messagesContainImage } from "@/lib/llm/helpers";
import { resolveGroqModel } from "@/lib/llm/groq";
import { resolveOpenRouterModel } from "@/lib/llm/openrouter";
import type { ChatMessage } from "@/lib/llm/types";

// ─── messagesContainImage ────────────────────────────────────────

describe("messagesContainImage", () => {
  it("returns false for an empty messages array", () => {
    expect(messagesContainImage([])).toBe(false);
  });

  it("returns false when every message is plain text", () => {
    expect(
      messagesContainImage([
        { role: "system", content: "You are a forex analyst." },
        { role: "user", content: "Analyze EURUSD on the 1H." },
        { role: "assistant", content: "It looks bullish." },
      ]),
    ).toBe(false);
  });

  it("returns false when no user message has image content", () => {
    expect(
      messagesContainImage([
        { role: "system", content: "system prompt" },
        { role: "user", content: [{ type: "text", text: "Just text" }] },
      ]),
    ).toBe(false);
  });

  it("returns true when a user message carries an image_url part", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
    expect(
      messagesContainImage([
        { role: "system", content: "system prompt" },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this chart" },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ]),
    ).toBe(true);
  });

  it("returns true when ONLY the user message is multimodal (any position)", () => {
    const dataUrl = "data:image/png;base64,xxx";
    expect(
      messagesContainImage([
        { role: "system", content: "first" },
        { role: "assistant", content: "second" },
        {
          role: "user",
          content: [
            { type: "text", text: "look at this" },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ]),
    ).toBe(true);
  });

  it("returns false when image_url-shaped objects appear OUTSIDE a content array", () => {
    // degenerate / adversarial — content is a string but contains the
    // literal text "image_url"; should NOT be detected.
    expect(
      messagesContainImage([
        { role: "user", content: "the word image_url is mentioned here" },
      ]),
    ).toBe(false);
  });

  it("returns false on a malformed array part (no `type`)", () => {
    expect(
      messagesContainImage([
        // @ts-expect-error testing malformed runtime input
        { role: "user", content: [{ image_url: { url: "x" } }] },
      ]),
    ).toBe(false);
  });

  it("returns false on null/undefined content", () => {
    expect(
      messagesContainImage([
        // @ts-expect-error testing defensive null handling
        { role: "user", content: null },
        // @ts-expect-error testing defensive undefined handling
        { role: "user", content: undefined },
      ]),
    ).toBe(false);
  });

  it("returns true if ANY message in the array has image_url", () => {
    const dataUrl = "data:image/png;base64,yyy";
    expect(
      messagesContainImage([
        { role: "system", content: "no image" },
        { role: "user", content: "no image here either" },
        {
          role: "assistant",
          content: [
            { type: "text", text: "describe" },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ]),
    ).toBe(true);
  });
});

// ─── resolveGroqModel ────────────────────────────────────────────

describe("resolveGroqModel", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const TEXT_ONLY: ChatMessage[] = [
    { role: "system", content: "sys" },
    { role: "user", content: "plain text prompt" },
  ];

  const WITH_IMAGE: ChatMessage[] = [
    { role: "system", content: "sys" },
    {
      role: "user",
      content: [
        { type: "text", text: "analyze" },
        {
          type: "image_url",
          image_url: { url: "data:image/png;base64,abc", detail: "high" },
        },
      ],
    },
  ];

  it("uses the hard-coded text default when messages are text-only and no env is set", () => {
    expect(resolveGroqModel(TEXT_ONLY)).toBe("llama-3.3-70b-versatile");
  });

  it("uses GROQ_MODEL env var for text-only requests", () => {
    vi.stubEnv("GROQ_MODEL", "llama-3.1-8b-instant");
    expect(resolveGroqModel(TEXT_ONLY)).toBe("llama-3.1-8b-instant");
  });

  it("uses the hard-coded vision default when multimodal + no env", () => {
    expect(resolveGroqModel(WITH_IMAGE)).toBe("llama-3.2-90b-vision-preview");
  });

  it("uses GROQ_VISION_MODEL env var when multimodal", () => {
    vi.stubEnv("GROQ_VISION_MODEL", "my-custom-vision-model");
    expect(resolveGroqModel(WITH_IMAGE)).toBe("my-custom-vision-model");
  });

  it("prefers options.model over any env/default", () => {
    vi.stubEnv("GROQ_MODEL", "from-env-text");
    vi.stubEnv("GROQ_VISION_MODEL", "from-env-vision");
    expect(resolveGroqModel(WITH_IMAGE, { model: "explicit-override" })).toBe(
      "explicit-override",
    );
    expect(resolveGroqModel(TEXT_ONLY, { model: "explicit-override" })).toBe(
      "explicit-override",
    );
  });

  it("routes multimodal to vision even when GROQ_MODEL (text env) is set", () => {
    // The user explicitly set GROQ_MODEL for text. If they submit an
    // image, we MUST use vision — otherwise Groq returns the
    // `messages[i].content must be a string` error.
    vi.stubEnv("GROQ_MODEL", "some-text-model");
    vi.stubEnv("GROQ_VISION_MODEL", "");
    // Falls back to hard-coded vision model when the vision env is unset.
    expect(resolveGroqModel(WITH_IMAGE)).toBe("llama-3.2-90b-vision-preview");
  });
});

// ─── resolveOpenRouterModel ──────────────────────────────────────

describe("resolveOpenRouterModel", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const TEXT_ONLY: ChatMessage[] = [
    { role: "user", content: "plain text" },
  ];

  const WITH_IMAGE: ChatMessage[] = [
    {
      role: "user",
      content: [
        { type: "text", text: "analyze" },
        {
          type: "image_url",
          image_url: { url: "data:image/png;base64,abc", detail: "high" },
        },
      ],
    },
  ];

  it("uses the hard-coded text default when text-only and no env is set", () => {
    expect(resolveOpenRouterModel(TEXT_ONLY)).toBe("openai/gpt-4o-mini");
  });

  it("uses OPENROUTER_MODEL env var for text-only requests", () => {
    vi.stubEnv("OPENROUTER_MODEL", "anthropic/claude-3-haiku");
    expect(resolveOpenRouterModel(TEXT_ONLY)).toBe("anthropic/claude-3-haiku");
  });

  it("uses the hard-coded vision default when multimodal + no env", () => {
    expect(resolveOpenRouterModel(WITH_IMAGE)).toBe(
      "google/gemini-2.0-flash-exp:free",
    );
  });

  it("uses OPENROUTER_VISION_MODEL env var when multimodal", () => {
    vi.stubEnv(
      "OPENROUTER_VISION_MODEL",
      "meta-llama/llama-3.2-90b-vision-instruct:free",
    );
    expect(resolveOpenRouterModel(WITH_IMAGE)).toBe(
      "meta-llama/llama-3.2-90b-vision-instruct:free",
    );
  });

  it("prefers options.model over any env/default", () => {
    vi.stubEnv("OPENROUTER_MODEL", "text-env-model");
    vi.stubEnv("OPENROUTER_VISION_MODEL", "vision-env-model");
    expect(
      resolveOpenRouterModel(WITH_IMAGE, { model: "explicit-override" }),
    ).toBe("explicit-override");
    expect(
      resolveOpenRouterModel(TEXT_ONLY, { model: "explicit-override" }),
    ).toBe("explicit-override");
  });

  it("routes multimodal to vision even when OPENROUTER_MODEL (text env) is set", () => {
    vi.stubEnv("OPENROUTER_MODEL", "openai/gpt-4o-mini");
    vi.stubEnv("OPENROUTER_VISION_MODEL", "");
    expect(resolveOpenRouterModel(WITH_IMAGE)).toBe(
      "google/gemini-2.0-flash-exp:free",
    );
  });

  it("preserves the explicit OPENROUTER_VISION_MODEL even with no env set for vision but yes for text", () => {
    // Documents the deliberate design: vision and text settings are
    // independent. A user can keep GPT-4o-mini for scanner text while
    // overriding only the vision slug.
    vi.stubEnv("OPENROUTER_MODEL", "openai/gpt-4o-mini");
    vi.stubEnv("OPENROUTER_VISION_MODEL", "qwen/qwen-2-vl-7b-instruct:free");
    expect(resolveOpenRouterModel(TEXT_ONLY)).toBe("openai/gpt-4o-mini");
    expect(resolveOpenRouterModel(WITH_IMAGE)).toBe(
      "qwen/qwen-2-vl-7b-instruct:free",
    );
  });
});
