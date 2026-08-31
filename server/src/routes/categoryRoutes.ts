import { Router } from 'express';
import {
  getActiveCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Public / Farmer
router.get('/active', getActiveCategories);

// Admin
router.get('/', authenticateToken, requireAdmin, getAllCategories);
router.post('/', authenticateToken, requireAdmin, createCategory);
router.put('/:id', authenticateToken, requireAdmin, updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, deleteCategory);

export default router;
