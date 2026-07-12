import { Router } from 'express';
import { VehicleController } from '../controllers/vehicle.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import { UserRole } from '../types';
import {
  createVehicleValidator,
  updateVehicleValidator,
  patchVehicleStatusValidator,
  getVehiclesQueryValidator,
} from '../validators/vehicle.validator';

const router = Router();
const controller = new VehicleController();

// ─── Allowed Roles Configurations ─────────────────────────────────────────────
const READ_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.FLEET_MANAGER,
  UserRole.SAFETY_OFFICER,
  UserRole.FINANCIAL_ANALYST,
  UserRole.DISPATCHER,
];

const WRITE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.FLEET_MANAGER,
];

// ─── GET /api/vehicles ────────────────────────────────────────────────────
router.get(
  '/',
  authenticate,
  requireRole(READ_ROLES),
  getVehiclesQueryValidator,
  handleValidationErrors,
  controller.getVehicles
);

// ─── GET /api/vehicles/:id ────────────────────────────────────────────────
router.get(
  '/:id',
  authenticate,
  requireRole(READ_ROLES),
  controller.getVehicleById
);

// ─── POST /api/vehicles ───────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  requireRole(WRITE_ROLES),
  createVehicleValidator,
  handleValidationErrors,
  controller.createVehicle
);

// ─── PUT /api/vehicles/:id ────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  requireRole(WRITE_ROLES),
  updateVehicleValidator,
  handleValidationErrors,
  controller.updateVehicle
);

// ─── PATCH /api/vehicles/:id/status ───────────────────────────────────────
router.patch(
  '/:id/status',
  authenticate,
  requireRole(WRITE_ROLES),
  patchVehicleStatusValidator,
  handleValidationErrors,
  controller.updateVehicleStatus
);

// ─── DELETE /api/vehicles/:id ─────────────────────────────────────────────
router.delete(
  '/:id',
  authenticate,
  requireRole(WRITE_ROLES),
  controller.deleteVehicle
);

export default router;
