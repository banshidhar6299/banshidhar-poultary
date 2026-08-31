import mongoose, { Document, Schema } from 'mongoose';

export interface IRateCard extends Document {
  title: string;
  titleHi: string;
  rate: number;
  unit: string;
  unitHi: string;
  effectiveDate: Date;
  note?: string;
  noteHi?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const RateCardSchema = new Schema<IRateCard>(
  {
    title: { type: String, required: true, trim: true },
    titleHi: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, default: 'per Chick' },
    unitHi: { type: String, required: true, default: 'प्रति चूजा' },
    effectiveDate: { type: Date, default: Date.now },
    note: { type: String },
    noteHi: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const RateCard = mongoose.model<IRateCard>('RateCard', RateCardSchema);
