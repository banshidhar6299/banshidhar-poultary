import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  savePushSubscription,
  getVapidPublicKey
} from '../controllers/notificationController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Public route for VAPID Key
router.get('/vapid-key', getVapidPublicKey);

router.use(authenticateToken);

router.get('/', getNotifications);
router.put('/:id/read', markNotificationRead);
router.post('/push-subscribe', savePushSubscription);

export default router;
