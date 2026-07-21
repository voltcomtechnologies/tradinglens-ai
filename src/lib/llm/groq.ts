/**
 * Groq Cloud LLM client — OpenAI-compatible chat completions API.
 * Free tier: 1M tokens/min, 1,000 requests/day, no credit card required.
 * Docs: https://console.groq.com/docs
 */

import type {
  ChatMessage,
  ChatCompletionOptions,
  LLMClient,
  StreamingChatCompletionOptions,
  ChatCompletionStream,
} from "./types";

const GROQ_BASE = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT = 60_000;

export const groqClient: LLMClient = {
  name: "Groq",

  isAvailable(): boolean {
    return !!process.env.GROQ_API_KEY;
  },

  async chatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const body = {
        model: options?.model ?? process.env.GROQ_MODEL ?? DEFAULT_MODEL,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        stream: false,
      };

      const response = await fetch(`${GROQ_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Groq API error ${response.status}: ${errorText.slice(0, 500)}`
        );
      }

      const data = (await response.json()) as {
        id: string;
        choices: Array<{
          message: { role: string; content: string };
          finish_reason: string;
        }>;
        error?: { message: string; code: string };
      };

      if (data.error) {
        throw new Error(`Groq error ${data.error.code}: ${data.error.message}`);
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Groq returned an empty response");
      }

      return content;
    } finally {
      clearTimeout(timeout);
    }
  },

  /**
   * Streaming chat completion (OpenAI-compatible SSE). Groq's endpoint
   * streams `data: {choices:[{delta:{content:'...'}}]}\n\n` events,
   * followed by a `data: [DONE]` sentinel. We forward each
   * `choices[0].delta.content` to the caller as it's emitted.
   */
  async *chatCompletionStream(
    messages: ChatMessage[],
    options?: StreamingChatCompletionOptions,
  ): ChatCompletionStream {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const callController = options?.signal ? undefined : new AbortController();
    const effectiveSignal =
      options?.signal ?? (callController?.signal as AbortSignal | undefined);
    if (callController) {
      setTimeout(() => callController.abort(), REQUEST_TIMEOUT).unref?.();
    }

    const body = {
      model: options?.model ?? process.env.GROQ_MODEL ?? DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true,
    };

    const response = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: effectiveSignal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Groq API error ${response.status}: ${errorText.slice(0, 500)}`,
      );
    }
    if (!response.body) {
      throw new Error("Groq returned an empty body for streaming");
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
            // Skip malformed lines silently (heartbeats / mid-write).
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
