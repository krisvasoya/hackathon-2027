import { FuelLog } from '@prisma/client';
import { FuelRepository, GetFuelLogParams } from '../repositories/fuel.repository';
import { prisma } from '../database/client';
import { AppError } from '../utils/app-error.util';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { logger } from '../config/logger';
import { writeAuditLog } from '../utils/audit.util';
import { PaginatedResult } from '../types';

export class FuelService {
  private readonly fuelRepository: FuelRepository;

  constructor() {
    this.fuelRepository = new FuelRepository();
  }

  async getFuelLogs(params: GetFuelLogParams): Promise<PaginatedResult<any>> {
    const data = await this.fuelRepository.findMany(params);
    const total = await this.fuelRepository.count(params);
    const totalPages = Math.ceil(total / params.limit);

    return {
      data,
      pagination: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages,
        hasNextPage: params.page < totalPages,
        hasPrevPage: params.page > 1,
      },
    };
  }

  async getFuelLogById(id: string): Promise<any> {
    const log = await this.fuelRepository.findById(id);
    if (!log) {
      throw new AppError('Fuel log not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return log;
  }

  async createFuelLog(
    data: Omit<FuelLog, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<FuelLog> {
    // 1. Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) {
      throw new AppError('Vehicle not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    // 2. Business Rule: Liters cannot exceed reasonable limit (e.g., 1500 liters)
    if (data.liters <= 0 || data.liters > 1500) {
      throw new AppError(
        `Business Rule Violation: Invalid fuel quantity (${data.liters} liters). Value must be between 0.1 and 1500 liters.`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 3. Verify trip if linked
    if (data.tripId) {
      const trip = await prisma.trip.findUnique({ where: { id: data.tripId } });
      if (!trip) {
        throw new AppError('Linked trip not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }
    }

    // Execute atomic transaction: Creates fuel log and matching expense of type 'Fuel'
    const fuelLog = await this.fuelRepository.executeCreateFuelLogTransaction(data);

    logger.info('Fuel Log Added', { fuelLogId: fuelLog.id, vehicleId: data.vehicleId });

    await writeAuditLog({
      userId,
      action: 'FUEL_LOG_CREATE',
      resource: 'fuel_logs',
      resourceId: fuelLog.id,
      ipAddress,
      userAgent,
      metadata: { vehicleId: data.vehicleId, liters: data.liters, totalCost: data.totalCost },
    });

    return fuelLog;
  }

  async updateFuelLog(
    id: string,
    data: Partial<Omit<FuelLog, 'id' | 'createdAt' | 'updatedAt'>>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<FuelLog> {
    const fuelLog = await this.getFuelLogById(id);

    // Validate liters if modified
    const targetLiters = data.liters !== undefined ? data.liters : fuelLog.liters;
    if (targetLiters <= 0 || targetLiters > 1500) {
      throw new AppError(
        `Business Rule Violation: Invalid fuel quantity (${targetLiters} liters). Must be between 0.1 and 1500 liters.`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (data.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
      if (!vehicle) {
        throw new AppError('Vehicle not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }
    }

    if (data.tripId) {
      const trip = await prisma.trip.findUnique({ where: { id: data.tripId } });
      if (!trip) {
        throw new AppError('Linked trip not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }
    }

    // Execute update transaction
    const updated = await this.fuelRepository.executeUpdateFuelLogTransaction(id, data);

    logger.info('Fuel Log Updated', { fuelLogId: id });

    await writeAuditLog({
      userId,
      action: 'FUEL_LOG_UPDATE',
      resource: 'fuel_logs',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { changes: data },
    });

    return updated;
  }

  async deleteFuelLog(
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const fuelLog = await this.getFuelLogById(id);

    // Execute atomic delete transaction (deletes linked expense first)
    await this.fuelRepository.executeDeleteFuelLogTransaction(id);

    logger.info('Fuel Log Deleted', { fuelLogId: id, deletedBy: userId });

    await writeAuditLog({
      userId,
      action: 'FUEL_LOG_DELETE',
      resource: 'fuel_logs',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { fuelStation: fuelLog.fuelStation, vehicleId: fuelLog.vehicleId },
    });
  }

  // Calculate Fuel Efficiency: Distance / Fuel Used
  async calculateFuelEfficiency(vehicleId: string): Promise<{
    totalDistance: number;
    totalLiters: number;
    efficiencyKml: number;
  }> {
    // Sum of all completed trip distances for vehicle
    const completedTrips = await prisma.trip.aggregate({
      where: {
        vehicleId,
        status: 'COMPLETED',
      },
      _sum: {
        actualDistance: true,
      },
    });

    // Sum of all liters from fuel logs for vehicle
    const fuelSummary = await prisma.fuelLog.aggregate({
      where: { vehicleId },
      _sum: {
        liters: true,
      },
    });

    const totalDistance = completedTrips._sum.actualDistance || 0;
    const totalLiters = fuelSummary._sum.liters || 0;

    const efficiencyKml = totalLiters > 0 ? totalDistance / totalLiters : 0;

    return {
      totalDistance,
      totalLiters,
      efficiencyKml,
    };
  }
}
