import mongoose, { Document, Schema } from 'mongoose';
import { NotificationType, UserRole } from '../types';

export interface INotification extends Document {
  recipientRole: UserRole;
  recipientId?: mongoose.Types.ObjectId; // For Farmer (if recipientRole is FARMER)
  type: NotificationType;
  title: string;
  titleHi?: string;
  message: string;
  messageHi?: string;
  deepLink?: string; // e.g. /farmer/orders/ORD-001, /farmer/ledger, /admin/orders
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientRole: { type: String, enum: ['ADMIN', 'FARMER'], required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'Farmer', index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'NEW_ORDER',
        'ORDER_STATUS_CHANGED',
        'PAYMENT_ADDED',
        'LEDGER_ADJUSTMENT',
        'CHICK_SUPPLY_ADDED',
        'BIRD_SALE_SETTLEMENT',
        'NEW_MESSAGE',
        'JOIN_REQUEST',
        'SYSTEM_ANNOUNCEMENT'
      ],
      index: true
    },
    title: { type: String, required: true },
    titleHi: { type: String },
    message: { type: String, required: true },
    messageHi: { type: String },
    deepLink: { type: String },
    metadata: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientRole: 1, recipientId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
