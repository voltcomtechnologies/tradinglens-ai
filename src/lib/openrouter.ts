/**
 * OpenRouter exports — kept for backward compatibility.
 * New code should import from `@/lib/llm` instead.
 */

import { chatCompletion as unifiedChatCompletion } from "./llm";
import type { ChatMessage, ChatCompletionOptions } from "./llm";

/**
 * Backward-compatible `chatCompletion` function.
 * Wraps the new unified function, hardcodes the preference to "openrouter",
 * and returns just the string content for backward compatibility.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options?: ChatCompletionOptions
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  const { content } = await unifiedChatCompletion("openrouter", messages, options);
  return content;
}

// Re-export constants, helpers, clients, and types from unified LLM module
export {
  buildTradingSystemPrompt,
  buildUserMessage,
  classifyAnalysisType,
  openrouterClient as default,
  groqClient,
  openrouterClient,
  type LLMProvider,
  type ChatMessage,
  type ChatCompletionOptions,
  type AnalysisType,
  type MessageContent,
  type TextContent,
  type ImageContent,
  type ImageUrlObject,
} from "./llm";
