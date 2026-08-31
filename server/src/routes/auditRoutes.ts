import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateToken, requireAdmin, getAuditLogs);

export default router;
