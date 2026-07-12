import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';
import { sendSuccess } from '../utils/response.util';

export class SearchController {
  searchAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = (req.query.q as string) || '';

      if (!q.trim()) {
        sendSuccess(res, { vehicles: [], drivers: [], trips: [], maintenance: [], fuel: [], expenses: [] }, 'Search completed');
        return;
      }

      // Query database entities in parallel
      const [vehicles, drivers, trips, maintenance, fuel, expenses] = await Promise.all([
        prisma.vehicle.findMany({
          where: {
            OR: [
              { registrationNumber: { contains: q, mode: 'insensitive' } },
              { vehicleName: { contains: q, mode: 'insensitive' } },
              { vehicleModel: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 5,
        }),
        prisma.driver.findMany({
          where: {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { licenseNumber: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 5,
        }),
        prisma.trip.findMany({
          where: {
            OR: [
              { tripNumber: { contains: q, mode: 'insensitive' } },
              { source: { contains: q, mode: 'insensitive' } },
              { destination: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 5,
        }),
        prisma.maintenance.findMany({
          where: {
            OR: [
              { maintenanceNumber: { contains: q, mode: 'insensitive' } },
              { maintenanceType: { contains: q, mode: 'insensitive' } },
              { workshopName: { contains: q, mode: 'insensitive' } },
              { technicianName: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 5,
        }),
        prisma.fuelLog.findMany({
          where: {
            OR: [
              { fuelStation: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 5,
        }),
        prisma.expense.findMany({
          where: {
            OR: [
              { description: { contains: q, mode: 'insensitive' } },
              { expenseType: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 5,
        }),
      ]);

      sendSuccess(res, { vehicles, drivers, trips, maintenance, fuel, expenses }, 'Search completed');
    } catch (error) {
      next(error);
    }
  };
}
