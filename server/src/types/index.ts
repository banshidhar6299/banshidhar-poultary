import { Request } from 'express';

export type UserRole = 'ADMIN' | 'FARMER';

export interface AuthPayload {
  userId: string;
  role: UserRole;
  username: string;
  farmerId?: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';

export type TransactionType =
  | 'PRODUCT_PURCHASE'
  | 'CHICK_PURCHASE'
  | 'PAYMENT_RECEIVED'
  | 'ADVANCE_PAYMENT'
  | 'BIRD_SALE_CREDIT'
  | 'ADJUSTMENT_DEBIT'
  | 'ADJUSTMENT_CREDIT'
  | 'DISCOUNT';

export type BatchStatus = 'ACTIVE' | 'READY_FOR_SALE' | 'SOLD' | 'CLOSED';

export type JoinRequestStatus = 'NEW' | 'CONTACTED' | 'APPROVED' | 'REJECTED';

export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO';

export type NotificationType =
  | 'NEW_ORDER'
  | 'ORDER_STATUS_CHANGED'
  | 'PAYMENT_ADDED'
  | 'LEDGER_ADJUSTMENT'
  | 'CHICK_SUPPLY_ADDED'
  | 'BIRD_SALE_SETTLEMENT'
  | 'NEW_MESSAGE'
  | 'JOIN_REQUEST'
  | 'SYSTEM_ANNOUNCEMENT';

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
}

export type AIProviderName = 'agentrouter' | 'gemini' | 'groq';

export interface ProviderHealthStatus {
  name: AIProviderName;
  displayName: string;
  isConfigured: boolean;
  isAvailable: boolean;
  cooldownRemainingSec: number;
  failureCount: number;
  supportsVision: boolean;
  model: string;
}
