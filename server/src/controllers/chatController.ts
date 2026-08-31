import { Request, Response } from 'express';
import { Conversation, Message } from '../models/Conversation';
import { Farmer } from '../models/Farmer';
import { Notification } from '../models/Notification';
import { AuthenticatedRequest, MessageType } from '../types';
import { processUploadedFile } from '../middlewares/upload';
import { emitMessage, emitNotification } from '../services/socketService';

// Admin: Get all conversations
export const getAdminConversations = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversations = await Conversation.find()
      .populate('farmerId', 'farmerId name phone village district status')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, data: conversations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Farmer: Get or Create own conversation
export const getFarmerConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    let conversation = await Conversation.findOne({ farmerId: user.userId });
    if (!conversation) {
      conversation = await Conversation.create({
        farmerId: user.userId,
        farmerName: user.name,
        lastMessage: 'Chat started',
        lastMessageAt: new Date()
      });
    }

    res.json({ success: true, data: conversation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Messages for a conversation (Paginated)
export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const user = req.user;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    if (user?.role === 'FARMER' && conversation.farmerId.toString() !== user.userId) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments({ conversationId })
    ]);

    // Mark messages as read for receiver
    const otherRole = user?.role === 'ADMIN' ? 'FARMER' : 'ADMIN';
    await Message.updateMany(
      { conversationId, senderRole: otherRole, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    if (user?.role === 'ADMIN') {
      conversation.unreadCountAdmin = 0;
    } else {
      conversation.unreadCountFarmer = 0;
    }
    await conversation.save();

    res.json({
      success: true,
      data: messages.reverse(), // Send in chronological order
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send Message (Text / Image / Audio / Video)
export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'TEXT', mediaDurationSec } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    if (user.role === 'FARMER' && conversation.farmerId.toString() !== user.userId) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    let mediaUrl: string | undefined;
    let mediaPublicId: string | undefined;
    let mediaSize: number | undefined;
    let mediaMimeType: string | undefined;
    let msgType: MessageType = (type as MessageType) || 'TEXT';

    if (req.file) {
      const uploadRes = await processUploadedFile(req.file, 'banshidhar_poultry/chat');
      mediaUrl = uploadRes.url;
      mediaPublicId = uploadRes.publicId;
      mediaSize = uploadRes.size;
      mediaMimeType = uploadRes.mimeType;

      if (req.file.mimetype.startsWith('audio/')) {
        msgType = 'AUDIO';
      } else if (req.file.mimetype.startsWith('video/')) {
        msgType = 'VIDEO';
      } else if (req.file.mimetype.startsWith('image/')) {
        msgType = 'IMAGE';
      }
    }

    if (!content && !mediaUrl) {
      res.status(400).json({ success: false, message: 'Message content or media file is required.' });
      return;
    }

    const message = await Message.create({
      conversationId: conversation._id,
      farmerId: conversation.farmerId,
      senderRole: user.role,
      senderId: user.userId,
      senderName: user.name,
      type: msgType,
      content,
      mediaUrl,
      mediaPublicId,
      mediaDurationSec: mediaDurationSec ? Number(mediaDurationSec) : undefined,
      mediaSize,
      mediaMimeType,
      isRead: false
    });

    // Update conversation metadata & unread counters
    const preview = msgType === 'TEXT' ? content : `[${msgType}] ${content || ''}`;
    conversation.lastMessage = preview;
    conversation.lastMessageType = msgType;
    conversation.lastMessageAt = new Date();

    if (user.role === 'ADMIN') {
      conversation.unreadCountFarmer += 1;
    } else {
      conversation.unreadCountAdmin += 1;
    }
    await conversation.save();

    // Emit Realtime Message
    emitMessage(conversationId, message);

    // Create In-App Notification if recipient is offline or in background
    if (user.role === 'ADMIN') {
      const notif = await Notification.create({
        recipientRole: 'FARMER',
        recipientId: conversation.farmerId,
        type: 'NEW_MESSAGE',
        title: 'New Message from Banshidhar Poultry',
        titleHi: 'बंशीधर पोल्ट्री से नया संदेश',
        message: preview,
        deepLink: '/farmer/messages',
        metadata: { conversationId: conversation._id }
      });
      emitNotification(notif);
    } else {
      const notif = await Notification.create({
        recipientRole: 'ADMIN',
        type: 'NEW_MESSAGE',
        title: `Message from ${user.name}`,
        titleHi: `${user.name} से नया संदेश`,
        message: preview,
        deepLink: '/admin/messages',
        metadata: { conversationId: conversation._id, farmerId: conversation.farmerId }
      });
      emitNotification(notif);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
