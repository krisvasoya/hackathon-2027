import { Router } from 'express';
import { DriverController } from '../controllers/driver.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import { UserRole } from '../types';
import {
  createDriverValidator,
  updateDriverValidator,
  patchDriverStatusValidator,
  getDriversQueryValidator,
} from '../validators/driver.validator';

const router = Router();
const controller = new DriverController();

// ─── Allowed Roles Configurations ─────────────────────────────────────────────
const READ_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.FLEET_MANAGER,
  UserRole.SAFETY_OFFICER,
  UserRole.FINANCIAL_ANALYST,
];

const WRITE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.FLEET_MANAGER,
  UserRole.SAFETY_OFFICER,
];

// ─── GET /api/drivers ─────────────────────────────────────────────────────
router.get(
  '/',
  authenticate,
  requireRole(READ_ROLES),
  getDriversQueryValidator,
  handleValidationErrors,
  controller.getDrivers
);

// ─── GET /api/drivers/:id ─────────────────────────────────────────────────
router.get(
  '/:id',
  authenticate,
  requireRole(READ_ROLES),
  controller.getDriverById
);

// ─── POST /api/drivers ────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  requireRole(WRITE_ROLES),
  createDriverValidator,
  handleValidationErrors,
  controller.createDriver
);

// ─── PUT /api/drivers/:id ─────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  requireRole(WRITE_ROLES),
  updateDriverValidator,
  handleValidationErrors,
  controller.updateDriver
);

// ─── PATCH /api/drivers/:id/status ────────────────────────────────────────
router.patch(
  '/:id/status',
  authenticate,
  requireRole(WRITE_ROLES),
  patchDriverStatusValidator,
  handleValidationErrors,
  controller.updateDriverStatus
);

// ─── DELETE /api/drivers/:id ──────────────────────────────────────────────
router.delete(
  '/:id',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN]), // Only Super Admin has deletion capabilities in enterprise RBAC details for security. Or full access for super admin. The prompt says Fleet Manager: Create, Update, View. Safety Officer: Create, Update, View. Super Admin: Full Access. So only SUPER_ADMIN can delete drivers!
  controller.deleteDriver
);

export default router;
