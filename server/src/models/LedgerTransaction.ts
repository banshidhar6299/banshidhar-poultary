import mongoose, { Document, Schema } from 'mongoose';
import { TransactionType } from '../types';

export interface ILedgerTransaction extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmerName: string;
  transactionDate: Date;
  transactionType: TransactionType;
  description: string;
  descriptionHi?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  debit: number; // Amount farmer owes (Baki / Kharid)
  credit: number; // Amount farmer paid / credited (Jama / Bhugtan)
  runningBalance?: number; // Snapshot of balance after this transaction
  referenceId?: string; // e.g. Order ID, ChickSupply ID, BirdSale ID, Receipt number
  referenceType?: 'ORDER' | 'CHICK_SUPPLY' | 'BIRD_SALE' | 'PAYMENT' | 'MANUAL_ADJUSTMENT';
  notes?: string;
  isVoided: boolean;
  voidReason?: string;
  voidedAt?: Date;
  voidedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerTransactionSchema = new Schema<ILedgerTransaction>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true, index: true },
    farmerName: { type: String, required: true },
    transactionDate: { type: Date, default: Date.now, index: true },
    transactionType: {
      type: String,
      required: true,
      enum: [
        'PRODUCT_PURCHASE',
        'CHICK_PURCHASE',
        'PAYMENT_RECEIVED',
        'ADVANCE_PAYMENT',
        'BIRD_SALE_CREDIT',
        'ADJUSTMENT_DEBIT',
        'ADJUSTMENT_CREDIT',
        'DISCOUNT'
      ],
      index: true
    },
    description: { type: String, required: true },
    descriptionHi: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    rate: { type: Number },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    runningBalance: { type: Number },
    referenceId: { type: String },
    referenceType: {
      type: String,
      enum: ['ORDER', 'CHICK_SUPPLY', 'BIRD_SALE', 'PAYMENT', 'MANUAL_ADJUSTMENT'],
      default: 'MANUAL_ADJUSTMENT'
    },
    notes: { type: String },
    isVoided: { type: Boolean, default: false, index: true },
    voidReason: { type: String },
    voidedAt: { type: Date },
    voidedBy: { type: String },
    createdBy: { type: String, default: 'ADMIN' }
  },
  { timestamps: true }
);

export const LedgerTransaction = mongoose.model<ILedgerTransaction>(
  'LedgerTransaction',
  LedgerTransactionSchema
);
