import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { PushSubscription } from '../models/PushSubscription';
import { AuthenticatedRequest } from '../types';
import webpush from 'web-push';

// Configure Web Push if keys exist
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@banshidharpoultry.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Get Notifications for Current User (Admin or Farmer)
export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const filter: any = {};
    if (user.role === 'ADMIN') {
      filter.recipientRole = 'ADMIN';
    } else {
      filter.recipientRole = 'FARMER';
      filter.recipientId = user.userId;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(50),
      Notification.countDocuments({ ...filter, isRead: false })
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark Single / All Notifications as Read
export const markNotificationRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { markAll } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (markAll) {
      const filter: any = user.role === 'ADMIN' ? { recipientRole: 'ADMIN' } : { recipientRole: 'FARMER', recipientId: user.userId };
      await Notification.updateMany({ ...filter, isRead: false }, { isRead: true, readAt: new Date() });
      res.json({ success: true, message: 'All notifications marked as read.' });
      return;
    }

    const notif = await Notification.findByIdAndUpdate(id, { isRead: true, readAt: new Date() }, { new: true });
    res.json({ success: true, data: notif });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Save Web Push Subscription
export const savePushSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { subscription } = req.body;

    if (!user || !subscription || !subscription.endpoint || !subscription.keys) {
      res.status(400).json({ success: false, message: 'Valid subscription object required.' });
      return;
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: user.userId,
        role: user.role,
        endpoint: subscription.endpoint,
        keys: subscription.keys
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Push subscription saved successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
