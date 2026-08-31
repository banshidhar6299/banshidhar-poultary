import mongoose, { Document, Schema } from 'mongoose';

export interface IChickSupply extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmerName: string;
  batchId?: mongoose.Types.ObjectId;
  batchNumber?: string;
  supplyDate: Date;
  breed: string;
  quantity: number;
  ratePerChick: number;
  totalAmount: number;
  isPostedToLedger: boolean;
  ledgerTransactionId?: mongoose.Types.ObjectId;
  hatcheryName?: string;
  mortalityInTransit?: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChickSupplySchema = new Schema<IChickSupply>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true, index: true },
    farmerName: { type: String, required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'ChickBatch' },
    batchNumber: { type: String },
    supplyDate: { type: Date, default: Date.now },
    breed: { type: String, default: 'Broiler (Cobb 500)' },
    quantity: { type: Number, required: true, min: 1 },
    ratePerChick: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    isPostedToLedger: { type: Boolean, default: true },
    ledgerTransactionId: { type: Schema.Types.ObjectId, ref: 'LedgerTransaction' },
    hatcheryName: { type: String, default: 'Banshidhar Premium Hatcheries' },
    mortalityInTransit: { type: Number, default: 0 },
    notes: { type: String },
    createdBy: { type: String, default: 'ADMIN' }
  },
  { timestamps: true }
);

export const ChickSupply = mongoose.model<IChickSupply>('ChickSupply', ChickSupplySchema);
