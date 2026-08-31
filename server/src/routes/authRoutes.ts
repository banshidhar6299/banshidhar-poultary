import { Router } from 'express';
import {
  adminLogin,
  farmerLogin,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  getMe
} from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.post('/admin/login', adminLogin);
router.post('/farmer/login', farmerLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateToken, changePassword);
router.put('/profile', authenticateToken, updateProfile);
router.get('/me', authenticateToken, getMe);

export default router;
