import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/orderController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { createOrderSchema, updateOrderStatusSchema, paginationQuery } from '../validators/schemas';

const router = Router();

router.use(authenticateToken);

router.post('/', validateRequest({ body: createOrderSchema }), createOrder);
router.get('/', validateRequest({ query: paginationQuery }), getOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', requireAdmin, validateRequest({ body: updateOrderStatusSchema }), updateOrderStatus);

export default router;
