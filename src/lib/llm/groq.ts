/**
 * Groq Cloud LLM client — OpenAI-compatible chat completions API.
 * Free tier: 1M tokens/min, 1,000 requests/day, no credit card required.
 * Docs: https://console.groq.com/docs
 */

import type { ChatMessage, ChatCompletionOptions, LLMClient } from "./types";

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
};
