import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import vehicleRoutes from './vehicle.routes';
import driverRoutes from './driver.routes';
import tripRoutes from './trip.routes';
import maintenanceRoutes from './maintenance.routes';
import fuelRoutes from './fuel.routes';
import expenseRoutes from './expense.routes';
import dashboardRoutes from './dashboard.routes';
import searchRoutes from './search.routes';
import notificationRoutes from './notification.routes';
import auditRoutes from './audit.routes';

// ─── Root API Router ──────────────────────────────────────────────────────────
// All routes are mounted here and imported once in app.ts.
// Adding new modules: import the router and mount it below.

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/trips', tripRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/fuel', fuelRoutes);
router.use('/expenses', expenseRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/search', searchRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditRoutes);

export default router;
