import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  savePushSubscription
} from '../controllers/notificationController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.put('/:id/read', markNotificationRead);
router.post('/push-subscribe', savePushSubscription);

export default router;
