import { Router } from 'express';
import { TripController } from '../controllers/trip.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import { UserRole } from '../types';
import {
  createTripValidator,
  updateTripValidator,
  completeTripValidator,
  getTripsQueryValidator,
} from '../validators/trip.validator';

const router = Router();
const controller = new TripController();

// ─── Allowed Roles Configurations ─────────────────────────────────────────────
const READ_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.FLEET_MANAGER,
  UserRole.SAFETY_OFFICER,
  UserRole.FINANCIAL_ANALYST,
  UserRole.DISPATCHER,
  UserRole.DRIVER,
];

const WRITE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.FLEET_MANAGER,
  UserRole.DISPATCHER,
];

const COMPLETE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.FLEET_MANAGER,
  UserRole.DISPATCHER,
  UserRole.DRIVER,
];

// ─── GET /api/trips ───────────────────────────────────────────────────────
router.get(
  '/',
  authenticate,
  requireRole(READ_ROLES),
  getTripsQueryValidator,
  handleValidationErrors,
  controller.getTrips
);

// ─── GET /api/trips/:id ───────────────────────────────────────────────────
router.get(
  '/:id',
  authenticate,
  requireRole(READ_ROLES),
  controller.getTripById
);

// ─── POST /api/trips ──────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  requireRole(WRITE_ROLES),
  createTripValidator,
  handleValidationErrors,
  controller.createTrip
);

// ─── PUT /api/trips/:id ───────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  requireRole(WRITE_ROLES),
  updateTripValidator,
  handleValidationErrors,
  controller.updateTrip
);

// ─── PATCH /api/trips/:id/dispatch ────────────────────────────────────────
router.patch(
  '/:id/dispatch',
  authenticate,
  requireRole(WRITE_ROLES),
  controller.dispatchTrip
);

// ─── PATCH /api/trips/:id/complete ────────────────────────────────────────
router.patch(
  '/:id/complete',
  authenticate,
  requireRole(COMPLETE_ROLES),
  completeTripValidator,
  handleValidationErrors,
  controller.completeTrip
);

// ─── PATCH /api/trips/:id/cancel ──────────────────────────────────────────
router.patch(
  '/:id/cancel',
  authenticate,
  requireRole(WRITE_ROLES),
  controller.cancelTrip
);

export default router;
