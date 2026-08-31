import { Router } from 'express';
import {
  getFarmerLedger,
  addLedgerTransaction,
  voidTransaction,
  downloadStatementPDF,
  getAdminKhatabookOverview,
  getAllLedgerTransactions
} from '../controllers/ledgerController';
import { authenticateToken, requireAdmin, requireAdminOrFarmerOwner } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import {
  addLedgerTransactionSchema,
  voidTransactionSchema,
  paginationQuery
} from '../validators/schemas';

const router = Router();

router.use(authenticateToken);

router.get('/khatabook/overview', requireAdmin, getAdminKhatabookOverview);
router.get('/transactions/all', requireAdmin, validateRequest({ query: paginationQuery }), getAllLedgerTransactions);
router.get('/farmer/:farmerId', requireAdminOrFarmerOwner(), validateRequest({ query: paginationQuery }), getFarmerLedger);
router.get('/farmer/:farmerId/pdf', requireAdminOrFarmerOwner(), downloadStatementPDF);
router.post('/transaction', requireAdmin, validateRequest({ body: addLedgerTransactionSchema }), addLedgerTransaction);
router.post('/transaction/:id/void', requireAdmin, validateRequest({ body: voidTransactionSchema }), voidTransaction);

export default router;
