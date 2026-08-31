import { Router } from 'express';
import { getAIStatus, getAIHealth, chatWithAI } from '../controllers/aiController';
import { upload } from '../middlewares/upload';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { aiLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.get('/status', getAIStatus);
router.get('/health', authenticateToken, requireAdmin, getAIHealth);
router.post('/chat', authenticateToken, aiLimiter, upload.single('image'), chatWithAI);

export default router;
