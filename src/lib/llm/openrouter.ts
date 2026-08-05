/**
 * OpenRouter LLM client — OpenAI-compatible chat completions API.
 * Docs: https://openrouter.ai/docs/api-reference/overview
 */

import type {
  ChatMessage,
  ChatCompletionOptions,
  LLMClient,
  StreamingChatCompletionOptions,
  ChatCompletionStream,
} from "./types";
import { resolveModel, fetchWithMigrationRetry } from "./helpers";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// Text default. `openai/gpt-4o-mini` is widely available on the free
// tier and works for our scanner-style structured analysis. Override
// via OPENROUTER_MODEL.
//
// Vision default. OpenRouter's free-tier multimodal offerings differ
// per-slug; we pick `google/gemini-2.0-flash-exp:free` because it has
// been a consistently-served free vision slug with a large context
// window. Override via OPENROUTER_VISION_MODEL if you need a different
// vision slug.
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const VISION_MODEL = "google/gemini-2.0-flash-exp:free";
const REQUEST_TIMEOUT = 90_000;

/**
 * Pick the right OpenRouter model for these messages. Delegates to
 * `resolveModel` for the priority order (see `helpers.ts`).
 */
export function resolveOpenRouterModel(
  messages: ChatMessage[],
  options?: ChatCompletionOptions,
): string {
  return resolveModel(
    "OPENROUTER_MODEL",
    "OPENROUTER_VISION_MODEL",
    DEFAULT_MODEL,
    VISION_MODEL,
    messages,
    options,
  );
}

export const openrouterClient: LLMClient = {
  name: "OpenRouter",

  isAvailable(): boolean {
    return !!process.env.OPENROUTER_API_KEY;
  },

  async chatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const body = {
        model: resolveOpenRouterModel(messages, options),
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        stream: false,
      };

      // See `groq.ts` for the rationale behind
      // fetchWithMigrationRetry — exactly the same retry semantics
      // apply here. OpenRouter is the most common source of these
      // migration hints (the platform rotates free-tier slugs fairly
      // often).
      const response = await fetchWithMigrationRetry({
        url: `${OPENROUTER_BASE}/chat/completions`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.APP_URL ?? "https://tradinglens-ai.vercel.app",
          "X-Title": "TradingLens AI",
        },
        body,
        signal: controller.signal,
        providerName: "OpenRouter",
      });

      const data = (await response.json()) as {
        id: string;
        choices: Array<{
          message: { role: string; content: string };
          finish_reason: string;
        }>;
        error?: { message: string; code: string };
      };

      if (data.error) {
        throw new Error(`OpenRouter error ${data.error.code}: ${data.error.message}`);
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("OpenRouter returned an empty response");
      }

      return content;
    } finally {
      clearTimeout(timeout);
    }
  },

  /**
   * Streaming chat completion. POSTs to OpenRouter with `stream: true`,
   * parses the resulting SSE event stream, and yields each
   * `choices[0].delta.content` chunk. Honours caller-provided
   * `options.signal` so a client disconnect aborts the upstream fetch
   * cleanly.
   */
  async *chatCompletionStream(
    messages: ChatMessage[],
    options?: StreamingChatCompletionOptions,
  ): ChatCompletionStream {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    // Combine caller signal with a hard timeout. We do NOT install the
    // timeout when the caller already gave us a signal (their signal is
    // authoritative for cancellation).
    const callController = options?.signal ? undefined : new AbortController();
    const effectiveSignal =
      options?.signal ?? (callController?.signal as AbortSignal | undefined);
    if (callController) {
      setTimeout(() => callController.abort(), REQUEST_TIMEOUT).unref?.();
    }

    const body = {
      model: resolveOpenRouterModel(messages, options),
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true,
    };

    const response = await fetchWithMigrationRetry({
      url: `${OPENROUTER_BASE}/chat/completions`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.APP_URL ?? "https://tradinglens-ai.vercel.app",
        "X-Title": "TradingLens AI",
      },
      body,
      signal: effectiveSignal,
      providerName: openrouterClient.name,
    });
    if (!response.body) {
      throw new Error("OpenRouter returned an empty body for streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let carry = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        carry += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = carry.indexOf("\n\n")) !== -1) {
          const event = carry.slice(0, idx);
          carry = carry.slice(idx + 2);
          if (!event.startsWith("data:")) continue;
          const data = event.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // Skip malformed JSON lines (heartbeat / keep-alive / mid-write).
          }
        }
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // already closed
      }
    }
  },
};
