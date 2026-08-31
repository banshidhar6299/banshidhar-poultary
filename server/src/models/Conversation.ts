import mongoose, { Document, Schema } from 'mongoose';
import { MessageType } from '../types';

export interface IConversation extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmerName: string;
  lastMessage?: string;
  lastMessageType?: MessageType;
  lastMessageAt?: Date;
  unreadCountAdmin: number;
  unreadCountFarmer: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true, unique: true, index: true },
    farmerName: { type: String, required: true },
    lastMessage: { type: String },
    lastMessageType: { type: String, enum: ['TEXT', 'IMAGE', 'AUDIO', 'VIDEO'], default: 'TEXT' },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCountAdmin: { type: Number, default: 0 },
    unreadCountFarmer: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  senderRole: 'ADMIN' | 'FARMER';
  senderId: string;
  senderName: string;
  type: MessageType;
  content?: string; // Text content or audio transcript/caption
  mediaUrl?: string; // Cloudinary secure URL or uploaded media URL
  mediaPublicId?: string;
  mediaDurationSec?: number; // For audio/video
  mediaSize?: number;
  mediaMimeType?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true, index: true },
    senderRole: { type: String, enum: ['ADMIN', 'FARMER'], required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    type: { type: String, enum: ['TEXT', 'IMAGE', 'AUDIO', 'VIDEO'], default: 'TEXT' },
    content: { type: String },
    mediaUrl: { type: String },
    mediaPublicId: { type: String },
    mediaDurationSec: { type: Number },
    mediaSize: { type: Number },
    mediaMimeType: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date }
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
