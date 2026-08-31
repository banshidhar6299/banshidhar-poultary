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
import { validateRequest } from '../middlewares/validate';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema
} from '../validators/schemas';

const router = Router();

router.post('/admin/login', validateRequest({ body: loginSchema }), adminLogin);
router.post('/farmer/login', validateRequest({ body: loginSchema }), farmerLogin);
router.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', validateRequest({ body: resetPasswordSchema }), resetPassword);
router.post('/change-password', authenticateToken, validateRequest({ body: changePasswordSchema }), changePassword);
router.put('/profile', authenticateToken, validateRequest({ body: updateProfileSchema }), updateProfile);
router.get('/me', authenticateToken, getMe);

export default router;
