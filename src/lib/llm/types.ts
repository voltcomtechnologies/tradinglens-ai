export type LLMProvider = "openrouter" | "groq" | "auto";

export type AnalysisType = "analyze" | "sentiment" | "levels" | "opportunities";

export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageUrlObject {
  url: string;
  detail?: "low" | "high" | "auto";
}

export interface ImageContent {
  type: "image_url";
  image_url: ImageUrlObject;
}

export type MessageContent = string | Array<TextContent | ImageContent>;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: MessageContent;
}

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface StreamingChatCompletionOptions extends ChatCompletionOptions {
  /**
   * Optional signal used to abort the upstream fetch while a stream is
   * in flight. Combined with an internal timeout to bound the worst-case
   * window a cancelled capture lingers server-side.
   */
  signal?: AbortSignal;
}

/**
 * AsyncIterable of assistant content deltas. The provider is responsible
 * for parsing SSE / chunked responses and forwarding only the body of
 * `choices[0].delta.content`. Implementations MUST honour `signal`
 * cancellation and abort the upstream fetch so a client disconnect
 * doesn't leak tokens to the upstream API.
 */
export type ChatCompletionStream = AsyncIterable<string>;

export interface LLMClient {
  chatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions,
  ): Promise<string>;
  /**
   * Streaming variant. Yields raw delta strings as the upstream LLM
   * emits them. Used by the chart-narrator feature so TTS can start on
   * the first sentence rather than waiting for a full reply.
   */
  chatCompletionStream(
    messages: ChatMessage[],
    options?: StreamingChatCompletionOptions,
  ): ChatCompletionStream;
  name: string;
  isAvailable(): boolean;
}
