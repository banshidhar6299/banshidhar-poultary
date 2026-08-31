import { Router } from 'express';
import {
  submitJoinRequest,
  getAllJoinRequests,
  updateJoinRequestStatus,
  convertToFarmer
} from '../controllers/joinRequestController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { joinRequestLimiter } from '../middlewares/rateLimiter';
import { createJoinRequestSchema, paginationQuery } from '../validators/schemas';

const router = Router();

// Public route with dedicated rate limiter and validation
router.post('/', joinRequestLimiter, validateRequest({ body: createJoinRequestSchema }), submitJoinRequest);

// Admin routes
router.get('/', authenticateToken, requireAdmin, validateRequest({ query: paginationQuery }), getAllJoinRequests);
router.put('/:id', authenticateToken, requireAdmin, updateJoinRequestStatus);
router.post('/:id/convert', authenticateToken, requireAdmin, convertToFarmer);

export default router;
