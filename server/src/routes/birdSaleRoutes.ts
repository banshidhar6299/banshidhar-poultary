import { Router } from 'express';
import {
  createBirdSaleSettlement,
  getBirdSaleSettlements
} from '../controllers/birdSaleController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getBirdSaleSettlements);
router.post('/settle', requireAdmin, createBirdSaleSettlement);

export default router;
