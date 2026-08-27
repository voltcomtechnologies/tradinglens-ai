/**
 * xAI Grok LLM client — OpenAI-compatible chat completions API.
 * Docs: https://docs.x.ai
 */

import type {
  ChatMessage,
  ChatCompletionOptions,
  LLMClient,
  StreamingChatCompletionOptions,
  ChatCompletionStream,
} from "./types";
import { resolveModel, fetchWithMigrationRetry } from "./helpers";

const XAI_BASE = "https://api.x.ai/v1";

// Text default: `grok-2-1212` (or `grok-2`). Override via XAI_MODEL.
// Vision default: `grok-2-vision-1212` (or `grok-2-vision`). Override via XAI_VISION_MODEL.
const DEFAULT_MODEL = "grok-2-1212";
const VISION_MODEL = "grok-2-vision-1212";
const REQUEST_TIMEOUT = 60_000;

/**
 * Pick the right xAI Grok model for these messages. Delegates to
 * `resolveModel` for priority order.
 */
export function resolveXaiModel(
  messages: ChatMessage[],
  options?: ChatCompletionOptions,
): string {
  return resolveModel(
    "XAI_MODEL",
    "XAI_VISION_MODEL",
    DEFAULT_MODEL,
    VISION_MODEL,
    messages,
    options,
  );
}

export const xaiClient: LLMClient = {
  name: "xAI (Grok)",

  isAvailable(): boolean {
    return !!process.env.XAI_API_KEY;
  },

  async chatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<string> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error("XAI_API_KEY is not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const body = {
        model: resolveXaiModel(messages, options),
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        stream: false,
      };

      const response = await fetchWithMigrationRetry({
        url: `${XAI_BASE}/chat/completions`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body,
        signal: controller.signal,
        providerName: "xAI (Grok)",
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
        throw new Error(`xAI error ${data.error.code}: ${data.error.message}`);
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("xAI returned an empty response");
      }

      return content;
    } finally {
      clearTimeout(timeout);
    }
  },

  async *chatCompletionStream(
    messages: ChatMessage[],
    options?: StreamingChatCompletionOptions,
  ): ChatCompletionStream {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error("XAI_API_KEY is not configured");
    }

    const callController = options?.signal ? undefined : new AbortController();
    const effectiveSignal =
      options?.signal ?? (callController?.signal as AbortSignal | undefined);
    if (callController) {
      setTimeout(() => callController.abort(), REQUEST_TIMEOUT).unref?.();
    }

    const body = {
      model: resolveXaiModel(messages, options),
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true,
    };

    const response = await fetchWithMigrationRetry({
      url: `${XAI_BASE}/chat/completions`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body,
      signal: effectiveSignal,
      providerName: xaiClient.name,
    });
    if (!response.body) {
      throw new Error("xAI returned an empty body for streaming");
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
            // Skip malformed lines silently
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
