import axios from 'axios';
import { AIProvider, ProviderChatOptions } from './types';
import { AIProviderName } from '../../types';

export class GroqProvider implements AIProvider {
  public readonly name: AIProviderName = 'groq';
  public readonly displayName: string = 'Groq';

  public isConfigured(): boolean {
    return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
  }

  public supportsVision(model?: string): boolean {
    const target = (model || '').toLowerCase();
    return target.includes('vision');
  }

  public async chat(options: ProviderChatOptions): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    // Automatically select a vision-capable model if image is present
    let model = options.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    if (options.isVision && !this.supportsVision(model)) {
      model = 'llama-3.2-11b-vision-preview';
    }

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
              text: msg.content || 'Analyze this poultry image.'
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
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model,
        messages: formattedMessages,
        max_tokens: options.maxTokens || 800,
        temperature: 0.6
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 18000
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content;
    if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
      throw new Error('Empty response received from Groq');
    }

    return reply.trim();
  }
}
