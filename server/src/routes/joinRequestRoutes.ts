import { Router } from 'express';
import {
  submitJoinRequest,
  getAllJoinRequests,
  updateJoinRequestStatus,
  convertToFarmer
} from '../controllers/joinRequestController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Public route
router.post('/', submitJoinRequest);

// Admin routes
router.get('/', authenticateToken, requireAdmin, getAllJoinRequests);
router.put('/:id', authenticateToken, requireAdmin, updateJoinRequestStatus);
router.post('/:id/convert', authenticateToken, requireAdmin, convertToFarmer);

export default router;
