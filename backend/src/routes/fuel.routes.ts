import { Router } from 'express';
import { FuelController } from '../controllers/fuel.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import { UserRole } from '../types';
import {
  createFuelLogValidator,
  updateFuelLogValidator,
  getFuelLogsQueryValidator,
} from '../validators/fuel.validator';

const router = Router();
const controller = new FuelController();

const READ_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.FLEET_MANAGER,
  UserRole.FINANCIAL_ANALYST,
  UserRole.DISPATCHER,
  UserRole.DRIVER,
];

const WRITE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.FLEET_MANAGER,
  UserRole.FINANCIAL_ANALYST,
  UserRole.DRIVER,
];

router.get(
  '/',
  authenticate,
  requireRole(READ_ROLES),
  getFuelLogsQueryValidator,
  handleValidationErrors,
  controller.getFuelLogs
);

router.get(
  '/:id',
  authenticate,
  requireRole(READ_ROLES),
  controller.getFuelLogById
);

router.post(
  '/',
  authenticate,
  requireRole(WRITE_ROLES),
  createFuelLogValidator,
  handleValidationErrors,
  controller.createFuelLog
);

router.put(
  '/:id',
  authenticate,
  requireRole(WRITE_ROLES),
  updateFuelLogValidator,
  handleValidationErrors,
  controller.updateFuelLog
);

router.delete(
  '/:id',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN, UserRole.FLEET_MANAGER]),
  controller.deleteFuelLog
);

// Get efficiency analytics for specific vehicle
router.get(
  '/vehicle/:vehicleId/efficiency',
  authenticate,
  requireRole(READ_ROLES),
  controller.getFuelEfficiency
);

export default router;
