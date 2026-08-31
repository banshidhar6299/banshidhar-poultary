import { Router } from 'express';
import {
  getAllFarmers,
  getFarmerById,
  createFarmer,
  updateFarmer,
  deleteFarmer,
  resetFarmerPassword,
  updateOwnProfile
} from '../controllers/farmerController';
import { authenticateToken, requireAdmin, requireFarmer } from '../middlewares/auth';

const router = Router();

// Admin routes
router.get('/', authenticateToken, requireAdmin, getAllFarmers);
router.get('/:id', authenticateToken, requireAdmin, getFarmerById);
router.post('/', authenticateToken, requireAdmin, createFarmer);
router.put('/:id', authenticateToken, requireAdmin, updateFarmer);
router.delete('/:id', authenticateToken, requireAdmin, deleteFarmer);
router.post('/:id/reset-password', authenticateToken, requireAdmin, resetFarmerPassword);

// Farmer self routes
router.put('/profile/update', authenticateToken, requireFarmer, updateOwnProfile);

export default router;
