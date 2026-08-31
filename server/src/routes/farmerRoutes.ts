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
import { validateRequest } from '../middlewares/validate';
import { createFarmerSchema, paginationQuery } from '../validators/schemas';

const router = Router();

// Admin routes
router.get('/', authenticateToken, requireAdmin, validateRequest({ query: paginationQuery }), getAllFarmers);
router.get('/:id', authenticateToken, requireAdmin, getFarmerById);
router.post('/', authenticateToken, requireAdmin, validateRequest({ body: createFarmerSchema }), createFarmer);
router.put('/:id', authenticateToken, requireAdmin, updateFarmer);
router.delete('/:id', authenticateToken, requireAdmin, deleteFarmer);
router.post('/:id/reset-password', authenticateToken, requireAdmin, resetFarmerPassword);

// Farmer self routes
router.put('/profile/update', authenticateToken, requireFarmer, updateOwnProfile);

export default router;
