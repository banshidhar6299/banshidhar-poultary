import { Router } from 'express';
import {
  getActiveRates,
  getAllRates,
  createRateCard,
  updateRateCard,
  deleteRateCard
} from '../controllers/rateCardController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Public / Farmer
router.get('/active', getActiveRates);

// Admin
router.get('/', authenticateToken, requireAdmin, getAllRates);
router.post('/', authenticateToken, requireAdmin, createRateCard);
router.put('/:id', authenticateToken, requireAdmin, updateRateCard);
router.delete('/:id', authenticateToken, requireAdmin, deleteRateCard);

export default router;
