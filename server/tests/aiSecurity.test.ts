import { describe, expect, it } from 'vitest';
import { aiChatBodySchema, aiChatMessageSchema } from '../src/validators/schemas';

describe('AI Endpoint Protection & Validation', () => {
  it('validates a correct user chat message', () => {
    const validMsg = {
      role: 'user',
      content: 'Hello, my chicks have low appetite.'
    };
    const result = aiChatMessageSchema.safeParse(validMsg);
    expect(result.success).toBe(true);
  });

  it('rejects invalid message roles', () => {
    const invalidRoleMsg = {
      role: 'superadmin',
      content: 'Hello'
    };
    const result = aiChatMessageSchema.safeParse(invalidRoleMsg);
    expect(result.success).toBe(false);
  });

  it('rejects oversized individual messages (>2000 chars)', () => {
    const hugeMsg = {
      role: 'user',
      content: 'a'.repeat(2001)
    };
    const result = aiChatMessageSchema.safeParse(hugeMsg);
    expect(result.success).toBe(false);
  });

  it('rejects message history exceeding 10 messages', () => {
    const messages = Array.from({ length: 11 }, () => ({
      role: 'user' as const,
      content: 'Message'
    }));
    const result = aiChatBodySchema.safeParse({ messages });
    expect(result.success).toBe(false);
  });

  it('accepts valid multi-turn chat up to 10 messages', () => {
    const messages = [
      { role: 'user' as const, content: 'Hi' },
      { role: 'assistant' as const, content: 'Hello! How can I help?' },
      { role: 'user' as const, content: 'My birds are 10 days old.' }
    ];
    const result = aiChatBodySchema.safeParse({ messages });
    expect(result.success).toBe(true);
  });
});
