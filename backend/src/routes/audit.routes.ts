import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new AuditController();

router.get('/', authenticate, controller.getAuditLogs);

export default router;
