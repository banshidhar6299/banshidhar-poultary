import { api } from '../api/client';

/**
 * Convert a base64 string to a Uint8Array for applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register Service Worker and subscribe user to Web Push Notifications
 */
export const registerAndSubscribePush = async (): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported in this browser.');
      return false;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // Check notification permission
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.log('Push notification permission denied by user.');
      return false;
    }

    // Fetch VAPID public key from backend
    const vapidRes = await api.get('/notifications/vapid-key');
    if (!vapidRes.data.success || !vapidRes.data.publicKey) {
      console.error('Failed to get VAPID public key from server.');
      return false;
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidRes.data.publicKey);

    // Get existing subscription or create new
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource
      });
    }

    if (!subscription) {
      console.error('Failed to obtain push subscription.');
      return false;
    }

    const subJson = subscription.toJSON();

    // Send subscription to server
    await api.post('/notifications/push-subscribe', {
      subscription: {
        endpoint: subJson.endpoint,
        keys: subJson.keys
      }
    });

    console.log('Push notification subscription registered successfully.');
    return true;
  } catch (error) {
    console.error('Error during push registration & subscription:', error);
    return false;
  }
};
