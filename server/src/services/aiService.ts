import { AIChatMessage, AIProviderName, ProviderHealthStatus } from '../types';
import { searchPoultryKnowledge } from '../constants/poultryKnowledge';
import { AISettings } from '../models/AISettings';
import { providersRegistry, AIProvider } from './aiProviders';

interface ProviderCircuitStatus {
  isAvailable: boolean;
  cooldownUntil: number;
  failureCount: number;
  lastFailureReason?: string;
}

const circuitStatusMap: Record<AIProviderName, ProviderCircuitStatus> = {
  agentrouter: { isAvailable: true, cooldownUntil: 0, failureCount: 0 },
  gemini: { isAvailable: true, cooldownUntil: 0, failureCount: 0 },
  groq: { isAvailable: true, cooldownUntil: 0, failureCount: 0 }
};

const DEFAULT_COOLDOWN_DURATION_MS = 60 * 1000; // 60 seconds

export const isProviderInCooldown = (provider: AIProviderName): boolean => {
  const status = circuitStatusMap[provider];
  if (!status.isAvailable && Date.now() > status.cooldownUntil) {
    status.isAvailable = true;
    status.failureCount = 0;
    status.lastFailureReason = undefined;
    console.log(`[AIService] Provider "${provider}" cooldown expired. Restored to active.`);
    return false;
  }
  return !status.isAvailable;
};

export const recordProviderFailure = (
  provider: AIProviderName,
  reason: string,
  cooldownMs = DEFAULT_COOLDOWN_DURATION_MS
): void => {
  console.warn(`[AIService] Provider "${provider}" failure: ${reason}. Placing into cooldown for ${cooldownMs / 1000}s.`);
  const status = circuitStatusMap[provider];
  status.failureCount += 1;
  status.isAvailable = false;
  status.cooldownUntil = Date.now() + cooldownMs;
  status.lastFailureReason = reason;
};

export const recordProviderSuccess = (provider: AIProviderName): void => {
  const status = circuitStatusMap[provider];
  status.isAvailable = true;
  status.failureCount = 0;
  status.lastFailureReason = undefined;
};

export const resetAllCooldowns = (): void => {
  for (const name of Object.keys(circuitStatusMap) as AIProviderName[]) {
    circuitStatusMap[name].isAvailable = true;
    circuitStatusMap[name].cooldownUntil = 0;
    circuitStatusMap[name].failureCount = 0;
    circuitStatusMap[name].lastFailureReason = undefined;
  }
};

const buildSystemPrompt = (ragContext: string, disclaimerText: string): string => {
  return `You are "Poultry AI Assistant" (कुक्कुट मित्र) for Banshidhar Poultry (बंशीधर पोल्ट्री) — a knowledgeable, supportive, and practical assistant for poultry farmers.

Guidelines:
1. Multilingual Support:
   - If the farmer writes in Hindi (हिंदी), respond clearly in Hindi.
   - If the farmer writes in Hinglish (e.g. "chick ko thand lag rahi hai kya karein"), respond naturally and warmly in Hinglish.
   - If the farmer writes in English, respond in professional English.
2. Knowledge Base Context:
${ragContext}
3. Poultry Expertise:
   - Provide practical advice on brooding temperature, feed formulation (Pre-Starter, Starter, Finisher), drinker cleaning, ventilation, litter management, and biosecurity.
   - For images of birds, droppings, or feed: explain visible observations and possibilities ("इन लक्षणों के कई कारण हो सकते हैं..."). Do NOT give absolute diagnoses from photos alone.
   - Never prescribe lethal or unverified drug dosages. Suggest supportive care (electrolytes, vitamin C in heat, clean water, temperature adjustments) and advise consulting a certified veterinarian for severe symptoms, bloody droppings, high mortality, or sudden outbreaks.
4. Disclaimer:
   Include this note where appropriate: "${disclaimerText}"
`;
};

// Intelligent Local Knowledge Fallback
export const generateLocalRAGResponse = (
  userQuery: string,
  hasImage: boolean,
  disclaimer: string
): string => {
  const q = userQuery.toLowerCase();
  const isHindi = /[\u0900-\u097F]/.test(userQuery) || q.includes('kya') || q.includes('chick') || q.includes('kaise') || q.includes('batao');

  const ragContext = searchPoultryKnowledge(userQuery);

  if (hasImage) {
    if (isHindi) {
      return `नमस्ते किसान भाई! बंशीधर पोल्ट्री AI सहायक में आपका स्वागत है।

📌 **अवलोकन एवं सुझाव:**
${ragContext}

🔍 **मुख्य सलाह:**
- यदि पक्षी सुस्त दिख रहे हैं या पंख बिखरे हैं, तो बिछाली (लीटर) की नमी और शेड का तापमान तुरंत जांचें।
- पीने के पानी में इलेक्ट्रोलाइट्स या हल्का विटामिन सप्लीमेंट दें।
- यदि चूजों में छींकने, सांस फूलने या खूनी दस्त के लक्षण हैं, तो बीमार पक्षियों को तुरंत अलग करें।

⚠️ *${disclaimer}*`;
    }
    return `Hello! Welcome to Banshidhar Poultry AI Assistant.

📌 **Observations & Management Guidance:**
${ragContext}

🔍 **Key Action Steps:**
- Check shed brooding temperature, litter dryness, and fresh air cross-ventilation.
- Provide clean drinking water with electrolyte / vitamin C support.
- If mortality rises or severe symptoms persist, isolate affected birds immediately.

⚠️ *${disclaimer}*`;
  }

  if (isHindi) {
    return `नमस्ते किसान भाई! बंशीधर पोल्ट्री AI सहायक में आपका स्वागत है।

📌 **सलाह एवं मार्गदर्शन:**
${ragContext}

💧 **महत्वपूर्ण सुझाव:**
- हमेशा ताज़ा, फफूंद-रहित दाना और 6.0-6.5 pH वाला साफ पानी दें।
- शेड में अमोनिया गैस न बनने दें और बिछाली को सूखा रखें।

⚠️ *${disclaimer}*`;
  }

  return `Hello Farmer! Welcome to Banshidhar Poultry AI Assistant.

📌 **Guidance on your query:**
${ragContext}

💧 **Key Farm Best Practices:**
- Ensure balanced nutrition across Pre-Starter, Starter, and Finisher stages.
- Maintain strict biosecurity, daily drinker disinfection, and proper ventilation.

⚠️ *${disclaimer}*`;
};

/**
 * Executes AI chat with intelligent multi-provider failover:
 * AgentRouter → Gemini → Groq → Local RAG Fallback
 */
export const executeAIChat = async (
  messages: AIChatMessage[]
): Promise<{ text: string; providerUsed: string }> => {
  // Load AI Settings from DB
  let settings = await AISettings.findOne();
  if (!settings) {
    settings = await AISettings.create({});
  }

  if (!settings.isEnabled) {
    throw new Error('AI Assistant is currently disabled by Banshidhar Poultry administration.');
  }

  const lastUserMsg = messages[messages.length - 1];
  const userQuery = lastUserMsg?.content || '';
  const hasImage = Boolean(lastUserMsg?.imageUrl);

  // RAG Context retrieval
  const ragContext = searchPoultryKnowledge(userQuery);
  const systemPrompt = buildSystemPrompt(ragContext, settings.emergencyDisclaimerHi);

  // Providers list in priority order (Default: AgentRouter → Gemini → Groq)
  const configuredPriority: AIProviderName[] = settings.providerPriority || ['agentrouter', 'gemini', 'groq'];
  const cooldownDuration = (settings.circuitBreakerCooldownSec || 60) * 1000;

  // Filter candidates based on vision requirements if image is attached
  for (const providerName of configuredPriority) {
    const provider = providersRegistry[providerName];
    if (!provider) continue;

    // Check circuit breaker cooldown
    if (isProviderInCooldown(providerName)) {
      console.log(`[AIService] Skipping provider ${providerName} (in cooldown)`);
      continue;
    }

    // Determine model for this provider
    let model = '';
    if (providerName === 'agentrouter') {
      model = settings.agentRouterModel || 'claude-3-5-sonnet-20241022';
    } else if (providerName === 'gemini') {
      model = settings.geminiModel || 'gemini-1.5-flash';
    } else if (providerName === 'groq') {
      model = settings.groqModel || 'llama-3.3-70b-versatile';
    }

    // Vision routing check
    if (hasImage && !provider.supportsVision(model)) {
      if (providerName === 'groq') {
        model = 'llama-3.2-11b-vision-preview';
      } else {
        console.log(`[AIService] Provider ${providerName} with model ${model} does not support vision. Routing to next vision provider.`);
        continue;
      }
    }

    try {
      const resultText = await provider.chat({
        messages,
        systemPrompt,
        model,
        maxTokens: settings.maxResponseTokens || 800,
        isVision: hasImage
      });

      if (resultText && resultText.trim().length > 0) {
        recordProviderSuccess(providerName);
        return { text: resultText, providerUsed: providerName };
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.message || 'Unknown provider error';
      recordProviderFailure(providerName, errorMsg, cooldownDuration);
      console.warn(`[AIService] Provider ${providerName} failed: ${errorMsg}. Falling back to next provider in chain.`);
    }
  }

  // If all external API providers failed or had no credentials:
  console.log('[AIService] All external AI providers unavailable or unconfigured. Employing local RAG engine fallback.');
  const fallbackText = generateLocalRAGResponse(
    userQuery,
    hasImage,
    settings.emergencyDisclaimerHi
  );

  return { text: fallbackText, providerUsed: 'local_rag_fallback' };
};

/**
 * Returns comprehensive health status of all 3 providers for Admin Settings
 */
export const getAIProvidersHealth = async (): Promise<{
  isEnabled: boolean;
  providerPriority: AIProviderName[];
  providers: ProviderHealthStatus[];
}> => {
  let settings = await AISettings.findOne();
  if (!settings) {
    settings = await AISettings.create({});
  }

  const providerNames: AIProviderName[] = ['agentrouter', 'gemini', 'groq'];
  const providers: ProviderHealthStatus[] = providerNames.map((name) => {
    const provider = providersRegistry[name];
    const status = circuitStatusMap[name];
    const inCooldown = isProviderInCooldown(name);

    let model = '';
    if (name === 'agentrouter') model = settings!.agentRouterModel;
    else if (name === 'gemini') model = settings!.geminiModel;
    else if (name === 'groq') model = settings!.groqModel;

    const cooldownRemainingSec = inCooldown
      ? Math.max(0, Math.ceil((status.cooldownUntil - Date.now()) / 1000))
      : 0;

    return {
      name,
      displayName: provider.displayName,
      isConfigured: provider.isConfigured(),
      isAvailable: !inCooldown,
      cooldownRemainingSec,
      failureCount: status.failureCount,
      supportsVision: provider.supportsVision(model),
      model
    };
  });

  return {
    isEnabled: settings.isEnabled,
    providerPriority: settings.providerPriority,
    providers
  };
};
