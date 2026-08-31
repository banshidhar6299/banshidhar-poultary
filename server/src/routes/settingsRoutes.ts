import { Router } from 'express';
import {
  getWebsiteSettings,
  updateWebsiteSettings,
  getAISettings,
  updateAISettings,
  getDashboardStats
} from '../controllers/settingsController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

// Public
router.get('/website', getWebsiteSettings);

// Admin
router.put(
  '/website',
  authenticateToken,
  requireAdmin,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'heroVideo', maxCount: 1 },
    { name: 'heroPoster', maxCount: 1 }
  ]),
  updateWebsiteSettings
);

router.get('/ai', authenticateToken, requireAdmin, getAISettings);
router.put('/ai', authenticateToken, requireAdmin, updateAISettings);
router.get('/dashboard-stats', authenticateToken, requireAdmin, getDashboardStats);

export default router;
