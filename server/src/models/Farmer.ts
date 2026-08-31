import mongoose, { Document, Schema } from 'mongoose';

export interface IFarmer extends Document {
  farmerId: string; // e.g. BP-1001
  username: string; // usually same as farmerId or mobile
  passwordHash: string;
  mustChangePassword: boolean;
  name: string;
  phone: string;
  email?: string;
  farmName?: string;
  address: string;
  village: string;
  district: string;
  state: string;
  pinCode: string;
  farmCapacity?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  notes?: string;
  lastLogin?: Date;
  role: 'FARMER';
  createdAt: Date;
  updatedAt: Date;
}

const FarmerSchema = new Schema<IFarmer>(
  {
    farmerId: { type: String, required: true, unique: true, uppercase: true, index: true },
    username: { type: String, required: true, unique: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    mustChangePassword: { type: Boolean, default: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, index: true, trim: true },
    email: { type: String, lowercase: true, trim: true, sparse: true },
    farmName: { type: String, trim: true },
    address: { type: String, required: true },
    village: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true, default: 'Bihar' },
    pinCode: { type: String, required: true },
    farmCapacity: { type: Number, default: 1000 },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true
    },
    notes: { type: String },
    lastLogin: { type: Date },
    role: { type: String, default: 'FARMER', enum: ['FARMER'] }
  },
  { timestamps: true }
);

export const Farmer = mongoose.model<IFarmer>('Farmer', FarmerSchema);
