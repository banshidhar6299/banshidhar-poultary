import mongoose, { Document, Schema } from 'mongoose';

export interface IFarmerJoinRequest extends Document {
  fullName: string;
  phone: string;
  email?: string;
  farmName?: string;
  farmAddress: string;
  village: string;
  district: string;
  state: string;
  pinCode: string;
  farmSize?: string;
  farmerType: 'NEW' | 'EXISTING';
  expectedChicks?: number;
  message?: string;
  status: 'NEW' | 'CONTACTED' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdFarmerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FarmerJoinRequestSchema = new Schema<IFarmerJoinRequest>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true },
    farmName: { type: String, trim: true },
    farmAddress: { type: String, required: true },
    village: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true, default: 'Bihar' },
    pinCode: { type: String, required: true },
    farmSize: { type: String },
    farmerType: { type: String, enum: ['NEW', 'EXISTING'], default: 'NEW' },
    expectedChicks: { type: Number, default: 500 },
    message: { type: String },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'APPROVED', 'REJECTED'],
      default: 'NEW',
      index: true
    },
    adminNotes: { type: String },
    createdFarmerId: { type: Schema.Types.ObjectId, ref: 'Farmer' }
  },
  { timestamps: true }
);

export const FarmerJoinRequest = mongoose.model<IFarmerJoinRequest>(
  'FarmerJoinRequest',
  FarmerJoinRequestSchema
);
