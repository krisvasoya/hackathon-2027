import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';
import { sendSuccess } from '../utils/response.util';
import { MaintenanceStatus } from '@prisma/client';

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  createdAt: Date;
  link: string;
}

export class NotificationController {
  getNotifications = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [recentLogs, expiredDrivers, overdueMaintenances] = await Promise.all([
        // 1. Fetch recent audit logs from last 7 days
        prisma.auditLog.findMany({
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        // 2. Fetch drivers with expired licenses
        prisma.driver.findMany({
          where: {
            licenseExpiryDate: {
              lt: new Date(),
            },
          },
          select: { id: true, fullName: true, licenseExpiryDate: true },
        }),
        // 3. Fetch overdue pending maintenances
        prisma.maintenance.findMany({
          where: {
            status: MaintenanceStatus.PENDING,
            scheduledDate: {
              lt: new Date(),
            },
          },
          select: { id: true, maintenanceNumber: true, scheduledDate: true },
        }),
      ]);

      const notifications: NotificationItem[] = [];

      // Map audit logs to notifications
      recentLogs.forEach((log) => {
        const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System';
        let type: 'info' | 'warning' | 'danger' | 'success' = 'info';
        let title = '';
        let message = '';
        let link = '/';

        switch (log.action) {
          case 'VEHICLE_CREATE':
            type = 'success';
            title = 'Vehicle Added';
            message = `Vehicle was registered in registry by ${userName}.`;
            link = '/vehicles';
            break;
          case 'DRIVER_CREATE':
            type = 'success';
            title = 'Driver Registered';
            message = `Driver profile was created by ${userName}.`;
            link = '/drivers';
            break;
          case 'TRIP_DISPATCH':
            type = 'info';
            title = 'Trip Dispatched';
            message = `Trip route was dispatched to active transit by ${userName}.`;
            link = '/trips';
            break;
          case 'TRIP_COMPLETE':
            type = 'success';
            title = 'Trip Completed';
            message = `Trip route was successfully completed by ${userName}.`;
            link = '/trips';
            break;
          case 'MAINTENANCE_START':
            type = 'warning';
            title = 'Maintenance Started';
            message = `Vehicle locked in repair bay for maintenance.`;
            link = '/maintenance';
            break;
          case 'MAINTENANCE_COMPLETE':
            type = 'success';
            title = 'Maintenance Completed';
            message = `Repair ticket closed. Vehicle released.`;
            link = '/maintenance';
            break;
          case 'FUEL_CREATE':
            type = 'info';
            title = 'Fuel Added';
            message = `New refuel log receipt registered by ${userName}.`;
            link = '/fuel';
            break;
          case 'EXPENSE_CREATE':
            type = 'info';
            title = 'Expense Added';
            message = `New expense ledger transaction registered by ${userName}.`;
            link = '/expenses';
            break;
          default:
            return; // Ignore other audit actions to avoid clutter
        }

        notifications.push({
          id: log.id,
          type,
          title,
          message,
          createdAt: log.createdAt,
          link,
        });
      });

      // Map expired licenses to warning notifications
      expiredDrivers.forEach((driver) => {
        notifications.push({
          id: `driver-expired-${driver.id}`,
          type: 'danger',
          title: 'Expired License',
          message: `Operator ${driver.fullName} has an expired license. Refuse dispatches immediately.`,
          createdAt: new Date(),
          link: '/drivers',
        });
      });

      // Map overdue maintenance to warning notifications
      overdueMaintenances.forEach((maint) => {
        notifications.push({
          id: `maint-overdue-${maint.id}`,
          type: 'danger',
          title: 'Overdue Maintenance',
          message: `Scheduled maintenance ticket ${maint.maintenanceNumber} is overdue.`,
          createdAt: new Date(),
          link: '/maintenance',
        });
      });

      // Sort notifications by date desc
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      sendSuccess(res, notifications, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
