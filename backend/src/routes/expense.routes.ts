import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import { UserRole } from '../types';
import {
  createExpenseValidator,
  updateExpenseValidator,
  getExpensesQueryValidator,
} from '../validators/expense.validator';

const router = Router();
const controller = new ExpenseController();

const ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.FLEET_MANAGER,
  UserRole.FINANCIAL_ANALYST,
];

router.get(
  '/',
  authenticate,
  requireRole(ROLES),
  getExpensesQueryValidator,
  handleValidationErrors,
  controller.getExpenses
);

router.get(
  '/:id',
  authenticate,
  requireRole(ROLES),
  controller.getExpenseById
);

router.post(
  '/',
  authenticate,
  requireRole(ROLES),
  createExpenseValidator,
  handleValidationErrors,
  controller.createExpense
);

router.put(
  '/:id',
  authenticate,
  requireRole(ROLES),
  updateExpenseValidator,
  handleValidationErrors,
  controller.updateExpense
);

router.delete(
  '/:id',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN, UserRole.FLEET_MANAGER]),
  controller.deleteExpense
);

// Get financials aggregate for vehicle ROI
router.get(
  '/vehicle/:vehicleId/financials',
  authenticate,
  requireRole(ROLES),
  controller.getVehicleFinancials
);

export default router;
