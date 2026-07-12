import { Router } from 'express';
import { MaintenanceController } from '../controllers/maintenance.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import { UserRole } from '../types';
import {
  createMaintenanceValidator,
  updateMaintenanceValidator,
  completeMaintenanceValidator,
  getMaintenanceQueryValidator,
} from '../validators/maintenance.validator';

const router = Router();
const controller = new MaintenanceController();

const READ_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.FLEET_MANAGER,
  UserRole.SAFETY_OFFICER,
  UserRole.DISPATCHER,
];

const WRITE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.FLEET_MANAGER,
  UserRole.SAFETY_OFFICER,
];

// List tickets
router.get(
  '/',
  authenticate,
  requireRole(READ_ROLES),
  getMaintenanceQueryValidator,
  handleValidationErrors,
  controller.getMaintenances
);

// Get detail
router.get(
  '/:id',
  authenticate,
  requireRole(READ_ROLES),
  controller.getMaintenanceById
);

// Create ticket
router.post(
  '/',
  authenticate,
  requireRole(WRITE_ROLES),
  createMaintenanceValidator,
  handleValidationErrors,
  controller.createMaintenance
);

// Update ticket
router.put(
  '/:id',
  authenticate,
  requireRole(WRITE_ROLES),
  updateMaintenanceValidator,
  handleValidationErrors,
  controller.updateMaintenance
);

// Start maintenance
router.patch(
  '/:id/start',
  authenticate,
  requireRole(WRITE_ROLES),
  controller.startMaintenance
);

// Complete ticket
router.patch(
  '/:id/complete',
  authenticate,
  requireRole(WRITE_ROLES),
  completeMaintenanceValidator,
  handleValidationErrors,
  controller.completeMaintenance
);

// Cancel ticket
router.patch(
  '/:id/cancel',
  authenticate,
  requireRole(WRITE_ROLES),
  controller.cancelMaintenance
);

// Delete ticket (Admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN]),
  controller.deleteMaintenance
);

export default router;
