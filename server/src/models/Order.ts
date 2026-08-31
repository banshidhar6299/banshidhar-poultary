import mongoose, { Document, Schema } from 'mongoose';
import { OrderStatus } from '../types';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productNameHi?: string;
  unitPrice: number; // Snapshot of price at time of order
  quantity: number;
  unit: string;
  totalPrice: number;
  imageUrl?: string;
}

export interface IOrder extends Document {
  orderId: string; // e.g. ORD-2026-0001
  farmerId: mongoose.Types.ObjectId;
  farmerName: string;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  createdBy: 'FARMER' | 'ADMIN';
  confirmedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  statusHistory: Array<{
    status: OrderStatus;
    changedAt: Date;
    changedBy: string;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    productNameHi: { type: String },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    imageUrl: { type: String }
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true, index: true },
    farmerName: { type: String, required: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    notes: { type: String },
    createdBy: { type: String, enum: ['FARMER', 'ADMIN'], default: 'FARMER' },
    confirmedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    statusHistory: [
      {
        status: { type: String, enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'] },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: String, default: 'SYSTEM' },
        note: { type: String }
      }
    ]
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
