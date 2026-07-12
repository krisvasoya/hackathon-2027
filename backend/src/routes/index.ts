import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import vehicleRoutes from './vehicle.routes';
import driverRoutes from './driver.routes';

// ─── Root API Router ──────────────────────────────────────────────────────────
// All routes are mounted here and imported once in app.ts.
// Adding new modules: import the router and mount it below.

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);

// Phase 2+ modules will be mounted here:
// router.use('/vehicles', authenticate, vehicleRoutes);
// router.use('/drivers', authenticate, driverRoutes);
// router.use('/trips', authenticate, tripRoutes);
// router.use('/maintenance', authenticate, maintenanceRoutes);
// router.use('/fuel', authenticate, fuelRoutes);

export default router;
