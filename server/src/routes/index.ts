import { Router } from 'express';
import authRoutes from './authRoutes';
import farmerRoutes from './farmerRoutes';
import joinRequestRoutes from './joinRequestRoutes';
import categoryRoutes from './categoryRoutes';
import productRoutes from './productRoutes';
import rateCardRoutes from './rateCardRoutes';
import orderRoutes from './orderRoutes';
import ledgerRoutes from './ledgerRoutes';
import batchRoutes from './batchRoutes';
import birdSaleRoutes from './birdSaleRoutes';
import chatRoutes from './chatRoutes';
import notificationRoutes from './notificationRoutes';
import aiRoutes from './aiRoutes';
import settingsRoutes from './settingsRoutes';
import auditRoutes from './auditRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/farmers', farmerRoutes);
router.use('/join-requests', joinRequestRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/rates', rateCardRoutes);
router.use('/orders', orderRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/batches', batchRoutes);
router.use('/bird-sales', birdSaleRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);
router.use('/settings', settingsRoutes);
router.use('/audit', auditRoutes);

export default router;
