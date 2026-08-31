import webpush from 'web-push';
import { PushSubscription } from '../models/PushSubscription';

// Initialize Web Push
const initWebPush = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@banshidharpoultry.com';

  if (publicKey && privateKey) {
    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } catch (err) {
      console.error('Error initializing web-push VAPID details:', err);
    }
  }
};

initWebPush();

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

/**
 * Send Web Push Notification to a specific User ID (e.g. Farmer or Admin)
 */
export const sendPushToUser = async (userId: string, payload: PushPayload): Promise<void> => {
  try {
    const subscriptions = await PushSubscription.find({ userId: String(userId) });
    if (!subscriptions || subscriptions.length === 0) return;

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.svg',
      badge: payload.badge || '/favicon.svg',
      tag: payload.tag || 'general',
      url: payload.url || '/',
      data: {
        url: payload.url || '/',
        ...payload.data
      }
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth
        }
      };

      try {
        await webpush.sendNotification(pushSub, payloadString);
      } catch (err: any) {
        // If subscription is expired or unsubscribed, remove it from DB
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error(`Failed to send web-push to sub ${sub._id}:`, err.message);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error: any) {
    console.error('Error in sendPushToUser:', error);
  }
};

/**
 * Send Web Push Notification to all users of a specific Role (e.g. 'ADMIN' or 'FARMER')
 */
export const sendPushToRole = async (role: 'ADMIN' | 'FARMER', payload: PushPayload): Promise<void> => {
  try {
    const subscriptions = await PushSubscription.find({ role });
    if (!subscriptions || subscriptions.length === 0) return;

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.svg',
      badge: payload.badge || '/favicon.svg',
      tag: payload.tag || 'role-broadcast',
      url: payload.url || '/',
      data: {
        url: payload.url || '/',
        ...payload.data
      }
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth
        }
      };

      try {
        await webpush.sendNotification(pushSub, payloadString);
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error(`Failed to send web-push to sub ${sub._id}:`, err.message);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error: any) {
    console.error('Error in sendPushToRole:', error);
  }
};
