import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  executeAIChat,
  isProviderInCooldown,
  recordProviderFailure,
  recordProviderSuccess,
  resetAllCooldowns,
  generateLocalRAGResponse
} from '../src/services/aiService';
import { providersRegistry } from '../src/services/aiProviders';
import { AISettings } from '../src/models/AISettings';

describe('AI Intelligent Router & Failover Test Suite', () => {
  beforeEach(() => {
    resetAllCooldowns();
    vi.restoreAllMocks();

    // Mock AISettings.findOne to return standard configuration
    vi.spyOn(AISettings, 'findOne').mockResolvedValue({
      isEnabled: true,
      primaryProvider: 'agentrouter',
      providerPriority: ['agentrouter', 'gemini', 'groq'],
      agentRouterModel: 'claude-3-5-sonnet-20241022',
      geminiModel: 'gemini-1.5-flash',
      groqModel: 'llama-3.3-70b-versatile',
      maxResponseTokens: 800,
      circuitBreakerCooldownSec: 60,
      emergencyDisclaimerHi: 'सूचना: यह केवल सामान्य पोल्ट्री स्वास्थ्य सलाह के लिए AI सहायक है।'
    } as any);
  });

  afterEach(() => {
    resetAllCooldowns();
    vi.restoreAllMocks();
  });

  it('1. AgentRouter Success (Normal primary flow)', async () => {
    vi.spyOn(providersRegistry.agentrouter, 'chat').mockResolvedValue(
      'AgentRouter: Brooding temperature should be 95°F for day-old chicks.'
    );

    const result = await executeAIChat([
      { role: 'user', content: 'What temperature for day-old chicks?' }
    ]);

    expect(result.providerUsed).toBe('agentrouter');
    expect(result.text).toContain('AgentRouter: Brooding temperature');
    expect(isProviderInCooldown('agentrouter')).toBe(false);
  });

  it('2. AgentRouter 429 Rate Limit → Automatic Failover to Gemini', async () => {
    // AgentRouter throws 429 Rate Limit error
    vi.spyOn(providersRegistry.agentrouter, 'chat').mockRejectedValue(
      new Error('429 Too Many Requests - AgentRouter quota exceeded')
    );

    // Gemini succeeds
    vi.spyOn(providersRegistry.gemini, 'chat').mockResolvedValue(
      'Gemini: For the first week, maintain 32-35°C in the brooding area.'
    );

    const result = await executeAIChat([
      { role: 'user', content: 'चूजों का तापमान कितना रखें?' }
    ]);

    // Should succeed on Gemini and place AgentRouter in cooldown
    expect(result.providerUsed).toBe('gemini');
    expect(result.text).toContain('Gemini: For the first week');
    expect(isProviderInCooldown('agentrouter')).toBe(true);
    expect(isProviderInCooldown('gemini')).toBe(false);
  });

  it('3. AgentRouter failure + Gemini failure → Automatic Failover to Groq', async () => {
    // Both AgentRouter and Gemini fail
    vi.spyOn(providersRegistry.agentrouter, 'chat').mockRejectedValue(
      new Error('AgentRouter timeout error')
    );
    vi.spyOn(providersRegistry.gemini, 'chat').mockRejectedValue(
      new Error('Gemini API service unavailable 503')
    );

    // Groq succeeds
    vi.spyOn(providersRegistry.groq, 'chat').mockResolvedValue(
      'Groq: Ensure proper litter management and 24% CP starter feed.'
    );

    const result = await executeAIChat([
      { role: 'user', content: 'Broiler starter feed crude protein requirements?' }
    ]);

    expect(result.providerUsed).toBe('groq');
    expect(result.text).toContain('Groq: Ensure proper litter management');
    expect(isProviderInCooldown('agentrouter')).toBe(true);
    expect(isProviderInCooldown('gemini')).toBe(true);
    expect(isProviderInCooldown('groq')).toBe(false);
  });

  it('4. All Providers Fail / In Cooldown → Intelligent Local RAG Fallback', async () => {
    // All 3 providers fail
    vi.spyOn(providersRegistry.agentrouter, 'chat').mockRejectedValue(new Error('Network error'));
    vi.spyOn(providersRegistry.gemini, 'chat').mockRejectedValue(new Error('Quota limit'));
    vi.spyOn(providersRegistry.groq, 'chat').mockRejectedValue(new Error('Internal server error'));

    const result = await executeAIChat([
      { role: 'user', content: 'चूजों को ब्रूडर में ठंड लग रही है, क्या करें?' }
    ]);

    expect(result.providerUsed).toBe('local_rag_fallback');
    expect(result.text).toContain('बंशीधर पोल्ट्री AI सहायक');
    expect(result.text).toContain('ब्रूडिंग और तापमान प्रबंधन');
  });

  it('5. Vision Image Routing: Auto-routes to vision-capable model and analyzes photo', async () => {
    vi.spyOn(providersRegistry.agentrouter, 'supportsVision').mockReturnValue(true);
    vi.spyOn(providersRegistry.agentrouter, 'chat').mockResolvedValue(
      'Photo Observation: The birds appear clustered, indicating potential chilling under the brooder.'
    );

    const result = await executeAIChat([
      {
        role: 'user',
        content: 'Check this bird condition',
        imageUrl: 'https://example.com/uploads/chick-photo.jpg'
      }
    ]);

    expect(result.providerUsed).toBe('agentrouter');
    expect(result.text).toContain('Photo Observation: The birds appear clustered');
  });

  it('6. Cooldown Auto-Recovery', () => {
    // Force fail AgentRouter with 10ms cooldown
    recordProviderFailure('agentrouter', 'Temporary test error', 10);
    expect(isProviderInCooldown('agentrouter')).toBe(true);

    // Advance time or wait 20ms
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(isProviderInCooldown('agentrouter')).toBe(false);
        resolve();
      }, 25);
    });
  });
});
