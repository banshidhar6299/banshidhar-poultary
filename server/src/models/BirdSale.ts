import mongoose, { Document, Schema } from 'mongoose';

export interface IBirdSale extends Document {
  settlementId: string; // e.g. STL-2026-0001
  farmerId: mongoose.Types.ObjectId;
  farmerName: string;
  batchId?: mongoose.Types.ObjectId;
  batchNumber?: string;
  settlementDate: Date;
  actualBirds: number;
  actualTotalKg: number;
  avgWeightKg: number;
  ratePerKg: number;
  grossAmount: number; // actualTotalKg * ratePerKg
  deductions: number; // e.g. loading, mortality, weighing deduction
  adjustments: number; // other adjustments (+/-)
  netCreditAmount: number; // grossAmount - deductions + adjustments
  isPostedToLedger: boolean;
  ledgerTransactionId?: mongoose.Types.ObjectId;
  buyerName?: string;
  vehicleNumber?: string;
  notes?: string;
  // Estimated batch gross margin analysis (if costs are linked)
  estimatedChickCost?: number;
  estimatedFeedCost?: number;
  estimatedOtherCost?: number;
  estimatedGrossMargin?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const BirdSaleSchema = new Schema<IBirdSale>(
  {
    settlementId: { type: String, required: true, unique: true, index: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true, index: true },
    farmerName: { type: String, required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'ChickBatch' },
    batchNumber: { type: String },
    settlementDate: { type: Date, default: Date.now, index: true },
    actualBirds: { type: Number, required: true, min: 1 },
    actualTotalKg: { type: Number, required: true, min: 0 },
    avgWeightKg: { type: Number, required: true, min: 0 },
    ratePerKg: { type: Number, required: true, min: 0 },
    grossAmount: { type: Number, required: true, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    adjustments: { type: Number, default: 0 },
    netCreditAmount: { type: Number, required: true },
    isPostedToLedger: { type: Boolean, default: true },
    ledgerTransactionId: { type: Schema.Types.ObjectId, ref: 'LedgerTransaction' },
    buyerName: { type: String },
    vehicleNumber: { type: String },
    notes: { type: String },
    estimatedChickCost: { type: Number, default: 0 },
    estimatedFeedCost: { type: Number, default: 0 },
    estimatedOtherCost: { type: Number, default: 0 },
    estimatedGrossMargin: { type: Number, default: 0 },
    createdBy: { type: String, default: 'ADMIN' }
  },
  { timestamps: true }
);

export const BirdSale = mongoose.model<IBirdSale>('BirdSale', BirdSaleSchema);
