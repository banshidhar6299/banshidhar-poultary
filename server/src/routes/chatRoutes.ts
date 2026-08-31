import { Router } from 'express';
import {
  getAdminConversations,
  getFarmerConversation,
  getMessages,
  sendMessage
} from '../controllers/chatController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

router.use(authenticateToken);

router.get('/conversations', requireAdmin, getAdminConversations);
router.get('/my-conversation', getFarmerConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', upload.single('media'), sendMessage);

export default router;
