import mongoose, { Document, Schema } from 'mongoose';
import { BatchStatus } from '../types';

export interface IChickBatch extends Document {
  batchNumber: string; // e.g. BATCH-2026-001
  farmerId: mongoose.Types.ObjectId;
  farmerName: string;
  breed: string; // e.g. Cobb 500, Ross 308, Hubchick
  chicksSupplied: number;
  startDate: Date;
  approxAgeDays: number;
  initialChicksCost: number;
  ratePerChick: number;
  mortalityCount: number;
  status: BatchStatus;
  notes?: string;
  // Bird sale readiness inquiry from farmer
  saleInquiry?: {
    isInquired: boolean;
    inquiredAt?: Date;
    approxBirds?: number;
    approxAvgWeightKg?: number;
    approxTotalKg?: number;
    notes?: string;
  };
  settledSaleId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChickBatchSchema = new Schema<IChickBatch>(
  {
    batchNumber: { type: String, required: true, unique: true, index: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true, index: true },
    farmerName: { type: String, required: true },
    breed: { type: String, default: 'Broiler (Cobb 500)' },
    chicksSupplied: { type: Number, required: true, min: 1 },
    startDate: { type: Date, default: Date.now },
    initialChicksCost: { type: Number, required: true, default: 0 },
    ratePerChick: { type: Number, required: true, default: 35 },
    mortalityCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'READY_FOR_SALE', 'SOLD', 'CLOSED'],
      default: 'ACTIVE',
      index: true
    },
    notes: { type: String },
    saleInquiry: {
      isInquired: { type: Boolean, default: false },
      inquiredAt: { type: Date },
      approxBirds: { type: Number },
      approxAvgWeightKg: { type: Number },
      approxTotalKg: { type: Number },
      notes: { type: String }
    },
    settledSaleId: { type: Schema.Types.ObjectId, ref: 'BirdSale' }
  },
  { timestamps: true }
);

ChickBatchSchema.virtual('approxAgeDays').get(function (this: IChickBatch) {
  const diffTime = Math.abs(Date.now() - new Date(this.startDate).getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

ChickBatchSchema.set('toJSON', { virtuals: true });
ChickBatchSchema.set('toObject', { virtuals: true });

export const ChickBatch = mongoose.model<IChickBatch>('ChickBatch', ChickBatchSchema);
