import axios from 'axios';
import { AIProvider, ProviderChatOptions } from './types';
import { AIProviderName } from '../../types';

export class GeminiProvider implements AIProvider {
  public readonly name: AIProviderName = 'gemini';
  public readonly displayName: string = 'Google Gemini';

  public isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  }

  public supportsVision(model?: string): boolean {
    // Gemini 1.5 Flash / Pro natively support multimodal vision
    return true;
  }

  public async chat(options: ProviderChatOptions): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const model = options.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const parts: any[] = [{ text: options.systemPrompt }];

    for (const msg of options.messages) {
      if (msg.role === 'user') {
        parts.push({ text: `Farmer: ${msg.content || ''}` });
        if (msg.imageUrl) {
          parts.push({ text: `[Attached Poultry Photo URL: ${msg.imageUrl}]` });
        }
      } else if (msg.role === 'assistant') {
        parts.push({ text: `Assistant: ${msg.content}` });
      }
    }

    const response = await axios.post(
      url,
      {
        contents: [{ parts }],
        generationConfig: {
          maxOutputTokens: options.maxTokens || 800,
          temperature: 0.6
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 18000
      }
    );

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
      throw new Error('Empty response received from Gemini');
    }

    return reply.trim();
  }
}
