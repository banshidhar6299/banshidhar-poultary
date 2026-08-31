import { AIProvider } from './types';
import { AgentRouterProvider } from './AgentRouterProvider';
import { GeminiProvider } from './GeminiProvider';
import { GroqProvider } from './GroqProvider';
import { AIProviderName } from '../../types';

export * from './types';
export * from './AgentRouterProvider';
export * from './GeminiProvider';
export * from './GroqProvider';

export const providersRegistry: Record<AIProviderName, AIProvider> = {
  agentrouter: new AgentRouterProvider(),
  gemini: new GeminiProvider(),
  groq: new GroqProvider()
};
