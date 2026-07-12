import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new NotificationController();

router.get('/', authenticate, controller.getNotifications);

export default router;
