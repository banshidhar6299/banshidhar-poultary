import { Router } from 'express';
import {
  getFarmerLedger,
  addLedgerTransaction,
  voidTransaction,
  downloadStatementPDF,
  getAdminKhatabookOverview,
  getAllLedgerTransactions
} from '../controllers/ledgerController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/khatabook/overview', requireAdmin, getAdminKhatabookOverview);
router.get('/transactions/all', requireAdmin, getAllLedgerTransactions);
router.get('/farmer/:farmerId', getFarmerLedger);
router.get('/farmer/:farmerId/pdf', downloadStatementPDF);
router.post('/transaction', requireAdmin, addLedgerTransaction);
router.post('/transaction/:id/void', requireAdmin, voidTransaction);

export default router;
