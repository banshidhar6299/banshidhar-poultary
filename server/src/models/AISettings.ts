import mongoose, { Document, Schema } from 'mongoose';
import { AIProviderName } from '../types';

export interface IAISettings extends Document {
  isEnabled: boolean;
  primaryProvider: AIProviderName;
  providerPriority: AIProviderName[];
  agentRouterModel: string;
  geminiModel: string;
  groqModel: string;
  maxResponseTokens: number;
  dailyQueryLimitPerFarmer: number;
  circuitBreakerCooldownSec: number;
  emergencyDisclaimerEn: string;
  emergencyDisclaimerHi: string;
  createdAt: Date;
  updatedAt: Date;
}

const AISettingsSchema = new Schema<IAISettings>(
  {
    isEnabled: { type: Boolean, default: true },
    primaryProvider: {
      type: String,
      enum: ['agentrouter', 'gemini', 'groq'],
      default: 'agentrouter'
    },
    providerPriority: {
      type: [String],
      default: ['agentrouter', 'gemini', 'groq']
    },
    agentRouterModel: {
      type: String,
      default: 'claude-3-5-sonnet-20241022'
    },
    geminiModel: {
      type: String,
      default: 'gemini-1.5-flash'
    },
    groqModel: {
      type: String,
      default: 'llama-3.3-70b-versatile'
    },
    maxResponseTokens: { type: Number, default: 800 },
    dailyQueryLimitPerFarmer: { type: Number, default: 30 },
    circuitBreakerCooldownSec: { type: Number, default: 60 },
    emergencyDisclaimerEn: {
      type: String,
      default: 'Notice: This is an AI Poultry Health Assistant for general guidance only. In severe disease, high mortality, or sudden drop in feed intake, please consult a certified poultry veterinarian immediately.'
    },
    emergencyDisclaimerHi: {
      type: String,
      default: 'सूचना: यह केवल सामान्य पोल्ट्री स्वास्थ्य सलाह के लिए AI सहायक है। गंभीर बीमारी, अधिक मृत्यु दर या मुर्गियों की असामान्य स्थिति में तुरंत किसी योग्य पशु चिकित्सक से संपर्क करें।'
    }
  },
  { timestamps: true }
);

export const AISettings = mongoose.model<IAISettings>('AISettings', AISettingsSchema);
