import axios from 'axios';
import { AIProvider, ProviderChatOptions } from './types';
import { AIProviderName } from '../../types';

export class AgentRouterProvider implements AIProvider {
  public readonly name: AIProviderName = 'agentrouter';
  public readonly displayName: string = 'AgentRouter';

  public isConfigured(): boolean {
    return Boolean(process.env.AGENTROUTER_API_KEY && process.env.AGENTROUTER_API_KEY.trim().length > 0);
  }

  public supportsVision(model?: string): boolean {
    const target = (model || '').toLowerCase();
    return (
      target.includes('vision') ||
      target.includes('claude-3') ||
      target.includes('gpt-4o') ||
      target.includes('gemini') ||
      target.includes('llama-3.2')
    );
  }

  public async chat(options: ProviderChatOptions): Promise<string> {
    const apiKey = process.env.AGENTROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('AgentRouter API key not configured');
    }

    const baseUrl = process.env.AGENTROUTER_BASE_URL || 'https://api.agentrouter.com/v1';
    const model = options.model || process.env.AGENTROUTER_MODEL || 'claude-3-5-sonnet-20241022';

    const formattedMessages: any[] = [
      { role: 'system', content: options.systemPrompt }
    ];

    for (const msg of options.messages) {
      if (msg.imageUrl) {
        formattedMessages.push({
          role: msg.role,
          content: [
            {
              type: 'text',
              text: msg.content || 'Please analyze this poultry bird / symptom image.'
            },
            {
              type: 'image_url',
              image_url: { url: msg.imageUrl }
            }
          ]
        });
      } else {
        formattedMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    const response = await axios.post(
      `${baseUrl.replace(/\/$/, '')}/chat/completions`,
      {
        model,
        messages: formattedMessages,
        max_tokens: options.maxTokens || 800,
        temperature: 0.6
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://banshidharpoultry.com',
          'X-Title': 'Banshidhar Poultry Health Engine'
        },
        timeout: 18000
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content;
    if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
      throw new Error('Empty response received from AgentRouter');
    }

    return reply.trim();
  }
}
