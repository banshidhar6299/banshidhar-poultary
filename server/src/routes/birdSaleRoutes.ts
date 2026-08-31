import { Router } from 'express';
import {
  createBirdSaleSettlement,
  getBirdSaleSettlements
} from '../controllers/birdSaleController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { createBirdSaleSchema, paginationQuery } from '../validators/schemas';

const router = Router();

router.use(authenticateToken);

router.get('/', validateRequest({ query: paginationQuery }), getBirdSaleSettlements);
router.post('/settle', requireAdmin, validateRequest({ body: createBirdSaleSchema }), createBirdSaleSettlement);

export default router;
