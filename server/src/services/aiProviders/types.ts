import { AIChatMessage, AIProviderName } from '../../types';

export interface ProviderChatOptions {
  messages: AIChatMessage[];
  systemPrompt: string;
  model: string;
  maxTokens: number;
  isVision: boolean;
}

export interface AIProvider {
  readonly name: AIProviderName;
  readonly displayName: string;
  isConfigured(): boolean;
  supportsVision(model?: string): boolean;
  chat(options: ProviderChatOptions): Promise<string>;
}
