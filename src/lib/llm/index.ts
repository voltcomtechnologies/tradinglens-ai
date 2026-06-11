import type { LLMProvider, ChatMessage, ChatCompletionOptions } from "./types";
import { groqClient } from "./groq";
import { openrouterClient } from "./openrouter";

export * from "./types";
export { groqClient } from "./groq";
export { openrouterClient } from "./openrouter";
export {
  buildUserMessage,
  buildTradingSystemPrompt,
  classifyAnalysisType,
} from "./helpers";

const clients = {
  openrouter: openrouterClient,
  groq: groqClient,
};

/**
 * Get the active LLM provider for a user.
 * If the provider is not available (no API key), falls back to the next available provider.
 * If no providers are available, throws an error.
 */
export function getProvider(preference: LLMProvider = "auto"): typeof openrouterClient {
  const order: LLMProvider[] = preference === "auto"
    ? ["groq", "openrouter"]
    : [preference, "groq", "openrouter"];

  for (const key of order) {
    if (key === "auto") continue;
    const client = clients[key];
    if (client?.isAvailable()) {
      return client;
    }
  }

  throw new Error(
    "No LLM provider is available. Please set GROQ_API_KEY or OPENROUTER_API_KEY in your environment variables."
  );
}

/**
 * Unified chat completion that routes to the user's preferred provider.
 * Automatically falls back to the next available provider if the first one fails.
 */
export async function chatCompletion(
  preference: LLMProvider,
  messages: ChatMessage[],
  options?: ChatCompletionOptions
): Promise<{ content: string; providerName: string }> {
  const order: LLMProvider[] = preference === "auto"
    ? ["groq", "openrouter"]
    : [preference, "groq", "openrouter"];

  const errors: string[] = [];

  for (const key of order) {
    if (key === "auto") continue;
    const client = clients[key];
    if (!client?.isAvailable()) continue;

    try {
      const content = await client.chatCompletion(messages, options);
      return { content, providerName: client.name };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${client.name}: ${msg}`);
      console.warn(`LLM provider ${client.name} failed, trying next...`, msg);
    }
  }

  throw new Error(
    `All LLM providers failed:\n${errors.join("\n")}`
  );
}
