import { Router } from 'express';
import {
  getBatches,
  addChickSupply,
  submitBirdSaleInquiry
} from '../controllers/batchController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { addChickSupplySchema, paginationQuery } from '../validators/schemas';

const router = Router();

router.use(authenticateToken);

router.get('/', validateRequest({ query: paginationQuery }), getBatches);
router.post('/supply', requireAdmin, validateRequest({ body: addChickSupplySchema }), addChickSupply);
router.post('/:batchId/sale-inquiry', submitBirdSaleInquiry);

export default router;
