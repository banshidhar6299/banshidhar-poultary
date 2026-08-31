export type UserRole = 'ADMIN' | 'FARMER';

export interface User {
  id: string;
  farmerId?: string;
  username: string;
  name: string;
  phone: string;
  email?: string;
  farmName?: string;
  address?: string;
  village?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  farmCapacity?: number;
  mustChangePassword?: boolean;
  role: UserRole;
  status?: string;
  notes?: string;
}

export interface BalanceSummary {
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
  isDue: boolean;
  isAdvance: boolean;
  amountDue: number;
  advanceAmount: number;
}

export interface Category {
  _id: string;
  name: string;
  nameHi: string;
  slug: string;
  description?: string;
  descriptionHi?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Product {
  _id: string;
  name: string;
  nameHi: string;
  category: Category | string;
  brand: string;
  imageUrl: string;
  shortDescription: string;
  shortDescriptionHi?: string;
  fullDescription?: string;
  fullDescriptionHi?: string;
  price: number;
  unit: string;
  unitHi?: string;
  bagWeightKg?: number;
  inStock: boolean;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface RateCard {
  _id: string;
  title: string;
  titleHi: string;
  rate: number;
  unit: string;
  unitHi: string;
  effectiveDate: string;
  note?: string;
  noteHi?: string;
  isActive: boolean;
  displayOrder: number;
  updatedAt: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  productId: string;
  productName: string;
  productNameHi?: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  totalPrice: number;
  imageUrl?: string;
}

export interface Order {
  _id: string;
  orderId: string;
  farmerId: string;
  farmerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  createdBy: 'FARMER' | 'ADMIN';
  confirmedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  statusHistory: Array<{
    status: OrderStatus;
    changedAt: string;
    changedBy: string;
    note?: string;
  }>;
  createdAt: string;
}

export type TransactionType =
  | 'PRODUCT_PURCHASE'
  | 'CHICK_PURCHASE'
  | 'PAYMENT_RECEIVED'
  | 'ADVANCE_PAYMENT'
  | 'BIRD_SALE_CREDIT'
  | 'ADJUSTMENT_DEBIT'
  | 'ADJUSTMENT_CREDIT'
  | 'DISCOUNT';

export interface LedgerTransaction {
  _id: string;
  farmerId: string;
  farmerName: string;
  transactionDate: string;
  transactionType: TransactionType;
  description: string;
  descriptionHi?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  debit: number;
  credit: number;
  calculatedRunningBalance?: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  isVoided: boolean;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  createdBy: string;
  createdAt: string;
}

export interface ChickBatch {
  _id: string;
  batchNumber: string;
  farmerId: string;
  farmerName: string;
  breed: string;
  chicksSupplied: number;
  startDate: string;
  approxAgeDays: number;
  initialChicksCost: number;
  ratePerChick: number;
  mortalityCount: number;
  status: 'ACTIVE' | 'READY_FOR_SALE' | 'SOLD' | 'CLOSED';
  notes?: string;
  saleInquiry?: {
    isInquired: boolean;
    inquiredAt?: string;
    approxBirds?: number;
    approxAvgWeightKg?: number;
    approxTotalKg?: number;
    notes?: string;
  };
  settledSaleId?: string;
  createdAt: string;
}

export interface BirdSale {
  _id: string;
  settlementId: string;
  farmerId: string;
  farmerName: string;
  batchId?: string;
  batchNumber?: string;
  settlementDate: string;
  actualBirds: number;
  actualTotalKg: number;
  avgWeightKg: number;
  ratePerKg: number;
  grossAmount: number;
  deductions: number;
  adjustments: number;
  netCreditAmount: number;
  buyerName?: string;
  vehicleNumber?: string;
  notes?: string;
  estimatedChickCost?: number;
  estimatedFeedCost?: number;
  estimatedGrossMargin?: number;
  createdAt: string;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO';

export interface Conversation {
  _id: string;
  farmerId: {
    _id: string;
    farmerId: string;
    name: string;
    phone: string;
    village?: string;
    district?: string;
    status?: string;
  } | string;
  farmerIdString: string;
  farmerName: string;
  lastMessage?: string;
  lastMessageType?: MessageType;
  lastMessageAt?: string;
  unreadCountAdmin: number;
  unreadCountFarmer: number;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  farmerId: string;
  senderRole: 'ADMIN' | 'FARMER';
  senderId: string;
  senderName: string;
  type: MessageType;
  content?: string;
  mediaUrl?: string;
  mediaDurationSec?: number;
  mediaSize?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface FarmerJoinRequest {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  farmName?: string;
  farmAddress: string;
  village: string;
  district: string;
  state: string;
  pinCode: string;
  expectedChicks: number;
  farmerType: string;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  performerRole: 'ADMIN' | 'FARMER' | 'SYSTEM';
  performerId?: string;
  targetModel?: string;
  targetId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  recipientRole: 'ADMIN' | 'FARMER';
  recipientId?: string;
  type: string;
  title: string;
  titleHi?: string;
  message: string;
  messageHi?: string;
  deepLink?: string;
  isRead: boolean;
  createdAt: string;
}

export interface WebsiteSettings {
  _id?: string;
  businessName: string;
  businessNameHi: string;
  tagline: string;
  taglineHi: string;
  logoUrl?: string;
  heroVideoUrl?: string;
  heroPosterUrl?: string;
  heroTitle: string;
  heroTitleHi: string;
  heroSubtitle: string;
  heroSubtitleHi: string;
  ctaPrimaryText: string;
  ctaPrimaryTextHi: string;
  aboutTitle: string;
  aboutTitleHi: string;
  aboutContent: string;
  aboutContentHi: string;
  whyChooseUs: Array<{
    title: string;
    titleHi: string;
    description: string;
    descriptionHi: string;
    iconName: string;
  }>;
  dealerName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  addressHi: string;
  googleMapsUrl: string;
  businessHours: string;
  businessHoursHi: string;
  showRatesSection: boolean;
  showAppDownloadSection: boolean;
  showCalculatorSection: boolean;
}

export interface ProviderHealthStatus {
  name: 'agentrouter' | 'gemini' | 'groq';
  displayName: string;
  isConfigured: boolean;
  isAvailable: boolean;
  cooldownRemainingSec: number;
  failureCount: number;
  supportsVision: boolean;
  model: string;
}

export interface AISettings {
  isEnabled: boolean;
  primaryProvider: string;
  providerPriority: string[];
  agentRouterModel: string;
  geminiModel: string;
  groqModel: string;
  maxResponseTokens: number;
  circuitBreakerCooldownSec?: number;
  dailyRequestLimitPerUser?: number;
  emergencyDisclaimerEn: string;
  emergencyDisclaimerHi: string;
}

export interface DashboardStats {
  totalFarmers: number;
  activeFarmers: number;
  pendingJoinRequests: number;
  todayOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  totalReceivable: number;
  totalAdvance: number;
  todayRates: RateCard[];
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
}
