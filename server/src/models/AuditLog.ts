import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: string;
  actorName: string;
  actorRole: 'ADMIN' | 'FARMER' | 'SYSTEM';
  action: string; // e.g. 'FARMER_CREATED', 'ORDER_CREATED', 'PAYMENT_ADDED', 'TRANSACTION_VOIDED', 'SETTLEMENT_POSTED'
  entityType: string; // e.g. 'Farmer', 'Order', 'LedgerTransaction', 'BirdSale', 'Settings'
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: String, required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, enum: ['ADMIN', 'FARMER', 'SYSTEM'], default: 'ADMIN' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export interface IPasswordResetToken extends Document {
  userId: mongoose.Types.ObjectId;
  userModel: 'Admin' | 'Farmer';
  email: string;
  tokenHash: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, refPath: 'userModel' },
    userModel: { type: String, required: true, enum: ['Admin', 'Farmer'] },
    email: { type: String, required: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    isUsed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const PasswordResetToken = mongoose.model<IPasswordResetToken>(
  'PasswordResetToken',
  PasswordResetTokenSchema
);
