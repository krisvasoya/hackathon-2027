import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import { getDashboardQueryValidator } from '../validators/dashboard.validator';

const router = Router();
const controller = new DashboardController();

router.get(
  '/',
  authenticate,
  getDashboardQueryValidator,
  handleValidationErrors,
  controller.getDashboardStats
);

export default router;
