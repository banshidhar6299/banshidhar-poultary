import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyJWT } from '../utils/helpers';
import { Conversation, Message } from '../models/Conversation';
import { Notification } from '../models/Notification';

let ioInstance: SocketIOServer | null = null;

export const initializeSocketIO = (io: SocketIOServer): void => {
  ioInstance = io;

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication required for socket'));
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return next(new Error('Invalid token for socket'));
    }

    (socket as any).user = payload;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`[Socket.IO] Connected: ${user.name} (${user.role}) - Socket ID: ${socket.id}`);

    // Join appropriate rooms
    if (user.role === 'ADMIN') {
      socket.join('admin_room');
    } else if (user.role === 'FARMER') {
      socket.join(`farmer_${user.userId}`);
      if (user.farmerId) socket.join(`farmer_${user.farmerId}`);
    }

    // Join specific conversation room
    const canAccessConversation = async (conversationId: string): Promise<boolean> => {
      if (!conversationId || typeof conversationId !== 'string') return false;
      if (user.role === 'ADMIN') return Boolean(await Conversation.exists({ _id: conversationId }));
      return Boolean(await Conversation.exists({ _id: conversationId, farmerId: user.userId }));
    };

    socket.on('join_conversation', async (conversationId: string) => {
      if (await canAccessConversation(conversationId)) socket.join(`conv_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conv_${conversationId}`);
    });

    // Realtime typing indicators
    socket.on('typing_start', async ({ conversationId }) => {
      if (!(await canAccessConversation(conversationId))) return;
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        conversationId,
        senderName: user.name,
        isTyping: true
      });
    });

    socket.on('typing_stop', async ({ conversationId }) => {
      if (!(await canAccessConversation(conversationId))) return;
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        conversationId,
        isTyping: false
      });
    });

    // Realtime message read update
    socket.on('mark_messages_read', async ({ conversationId }) => {
      try {
        if (!(await canAccessConversation(conversationId))) return;
        const readerRole = user.role;
        await Message.updateMany(
          {
            conversationId,
            senderRole: readerRole === 'ADMIN' ? 'FARMER' : 'ADMIN',
            isRead: false
          },
          { isRead: true, readAt: new Date() }
        );

        if (readerRole === 'ADMIN') {
          await Conversation.findByIdAndUpdate(conversationId, { unreadCountAdmin: 0 });
        } else {
          await Conversation.findByIdAndUpdate(conversationId, { unreadCountFarmer: 0 });
        }

        io.to(`conv_${conversationId}`).emit('messages_read', { conversationId, readerRole });
      } catch (err) {
        console.error('[Socket.IO] Error marking messages read:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Disconnected: ${user.name} (${user.role})`);
    });
  });
};

export const getIO = (): SocketIOServer | null => ioInstance;

// Helper emit methods
export const emitNotification = (notification: any): void => {
  if (!ioInstance) return;

  if (notification.recipientRole === 'ADMIN') {
    ioInstance.to('admin_room').emit('new_notification', notification);
  } else if (notification.recipientId) {
    ioInstance.to(`farmer_${notification.recipientId}`).emit('new_notification', notification);
  }
};

export const emitMessage = (conversationId: string, message: any): void => {
  if (!ioInstance) return;
  ioInstance.to(`conv_${conversationId}`).emit('new_message', message);
  ioInstance.to('admin_room').emit('conversation_updated', { conversationId, message });
  if (message.farmerId) {
    ioInstance.to(`farmer_${message.farmerId}`).emit('conversation_updated', { conversationId, message });
  }
};

export const emitOrderUpdate = (order: any): void => {
  if (!ioInstance) return;
  ioInstance.to('admin_room').emit('order_updated', order);
  ioInstance.to(`farmer_${order.farmerId}`).emit('order_updated', order);
};

export const emitLedgerUpdate = (farmerId: string, ledgerSummary: any): void => {
  if (!ioInstance) return;
  ioInstance.to('admin_room').emit('ledger_updated', { farmerId, ledgerSummary });
  ioInstance.to(`farmer_${farmerId}`).emit('ledger_updated', { farmerId, ledgerSummary });
};
