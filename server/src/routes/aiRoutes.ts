import { Router } from 'express';
import { getAIStatus, getAIHealth, chatWithAI } from '../controllers/aiController';
import { upload } from '../middlewares/upload';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

router.get('/status', getAIStatus);
router.get('/health', authenticateToken, requireAdmin, getAIHealth);
router.post('/chat', upload.single('image'), chatWithAI);

export default router;
