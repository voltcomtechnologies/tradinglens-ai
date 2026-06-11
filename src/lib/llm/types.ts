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

export interface LLMClient {
  chatCompletion(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<string>;
  name: string;
  isAvailable(): boolean;
}
