import { Router } from 'express';
import {
  getActiveProducts,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

// Public / Farmer
router.get('/active', getActiveProducts);

// Admin
router.get('/', authenticateToken, requireAdmin, getAllProducts);
router.get('/:id', getProductById);
router.post('/', authenticateToken, requireAdmin, upload.single('image'), createProduct);
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

export default router;
