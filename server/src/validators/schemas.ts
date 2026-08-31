import { z } from 'zod';

// ─── Shared Primitives ───────────────────────────────────────────────
const mongoId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');
const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional()
}).passthrough();

const positiveFinite = z.coerce.number().positive().finite();
const nonNegativeFinite = z.coerce.number().nonnegative().finite();

// ─── Auth Schemas ────────────────────────────────────────────────────
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(200),
  password: z.string().min(1, 'Password is required').max(200)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required').max(200),
  role: z.enum(['ADMIN', 'FARMER']).default('ADMIN')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required').max(200),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(200),
  role: z.enum(['ADMIN', 'FARMER']).default('ADMIN')
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(200)
});

export const updateProfileSchema = z.object({
  email: z.string().email().max(200).optional(),
  phone: z.string().max(20).optional(),
  name: z.string().max(100).optional()
});

// ─── AI Chat Schemas ─────────────────────────────────────────────────
export const aiChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(2000, 'Message too long (max 2000 chars)'),
  imageUrl: z.string().url().optional()
});

export const aiChatBodySchema = z.object({
  messages: z.union([
    z.array(aiChatMessageSchema).min(1).max(10),
    z.string().max(10000) // Allow JSON string from form-data
  ])
});

// ─── Order Schemas ───────────────────────────────────────────────────
const orderItemSchema = z.object({
  productId: mongoId,
  quantity: z.coerce.number().int().min(1).max(100000)
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(50),
  notes: z.string().max(500).optional(),
  targetFarmerId: mongoId.optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED']),
  note: z.string().max(500).optional(),
  postToLedger: z.boolean().default(true)
});

// ─── Ledger Schemas ──────────────────────────────────────────────────
export const addLedgerTransactionSchema = z.object({
  farmerId: mongoId,
  transactionDate: z.string().optional(),
  transactionTime: z.string().optional(),
  transactionType: z.enum([
    'PRODUCT_PURCHASE', 'CHICK_PURCHASE', 'PAYMENT_RECEIVED',
    'ADVANCE_PAYMENT', 'BIRD_SALE_CREDIT', 'ADJUSTMENT_DEBIT',
    'ADJUSTMENT_CREDIT', 'DISCOUNT'
  ]).default('PRODUCT_PURCHASE'),
  productId: z.string().optional(),
  productName: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  descriptionHi: z.string().max(500).optional(),
  quantity: z.coerce.number().nonnegative().finite().max(1_000_000).optional(),
  unit: z.string().max(50).optional(),
  rate: z.coerce.number().nonnegative().finite().max(10_000_000).optional(),
  amount: z.coerce.number().nonnegative().finite().max(100_000_000).optional(),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']).optional(),
  referenceId: z.string().max(100).optional(),
  notes: z.string().max(500).optional()
});

export const voidTransactionSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500)
});

// ─── Batch / Chick Supply Schemas ────────────────────────────────────
export const addChickSupplySchema = z.object({
  farmerId: mongoId,
  supplyDate: z.string().optional(),
  breed: z.string().max(100).default('Broiler (Cobb 500)'),
  quantity: positiveFinite.pipe(z.number().max(1_000_000)),
  ratePerChick: positiveFinite.pipe(z.number().max(10_000)),
  createNewBatch: z.boolean().default(true),
  hatcheryName: z.string().max(200).optional(),
  postToLedger: z.boolean().default(true),
  notes: z.string().max(500).optional()
});

// ─── Bird Sale Schemas ───────────────────────────────────────────────
export const createBirdSaleSchema = z.object({
  farmerId: mongoId,
  batchId: mongoId.optional(),
  settlementDate: z.string().optional(),
  actualBirds: positiveFinite.pipe(z.number().int().max(1_000_000)),
  actualTotalKg: positiveFinite.pipe(z.number().max(1_000_000)),
  ratePerKg: positiveFinite.pipe(z.number().max(100_000)),
  deductions: nonNegativeFinite.pipe(z.number().max(100_000_000)).default(0),
  adjustments: z.coerce.number().finite().max(100_000_000).default(0),
  postToLedger: z.boolean().default(true),
  buyerName: z.string().max(200).optional(),
  vehicleNumber: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  estimatedChickCost: nonNegativeFinite.default(0),
  estimatedFeedCost: nonNegativeFinite.default(0)
});

// ─── Farmer Management ───────────────────────────────────────────────
export const createFarmerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  email: z.string().email().max(200).optional().or(z.literal('')),
  farmName: z.string().max(200).optional(),
  address: z.string().min(1).max(500),
  village: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  state: z.string().max(100).default('Bihar'),
  pinCode: z.string().min(1).max(10),
  farmCapacity: z.coerce.number().int().min(0).max(1_000_000).default(1000),
  notes: z.string().max(500).optional(),
  password: z.string().max(200).optional()
});

// ─── Join Request Schemas ────────────────────────────────────────────
export const createJoinRequestSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  village: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  message: z.string().max(500).optional()
});

// ─── Pagination Query ────────────────────────────────────────────────
export { paginationQuery, mongoId };
