import { Router } from 'express';
import {
  getBatches,
  addChickSupply,
  submitBirdSaleInquiry
} from '../controllers/batchController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getBatches);
router.post('/supply', requireAdmin, addChickSupply);
router.post('/:batchId/sale-inquiry', submitBirdSaleInquiry);

export default router;
