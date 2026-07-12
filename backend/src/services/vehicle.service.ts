import { Vehicle, VehicleStatus } from '@prisma/client';
import { VehicleRepository, GetVehiclesParams } from '../repositories/vehicle.repository';
import { AppError } from '../utils/app-error.util';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { logger } from '../config/logger';
import { writeAuditLog } from '../utils/audit.util';
import { PaginatedResult } from '../types';

export class VehicleService {
  private readonly vehicleRepository: VehicleRepository;

  constructor() {
    this.vehicleRepository = new VehicleRepository();
  }

  // ─── Get All Vehicles (Paginated, Sorted, Filtered) ────────────────────────
  async getVehicles(params: GetVehiclesParams): Promise<PaginatedResult<Vehicle>> {
    const data = await this.vehicleRepository.findMany(params);
    const total = await this.vehicleRepository.count(params);

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

  // ─── Get Vehicle By ID ─────────────────────────────────────────────────────
  async getVehicleById(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return vehicle;
  }

  // ─── Create Vehicle ────────────────────────────────────────────────────────
  async createVehicle(
    data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Vehicle> {
    // Unique registration check
    const existing = await this.vehicleRepository.findByRegistrationNumber(data.registrationNumber);
    if (existing) {
      throw new AppError(
        `Vehicle with registration number '${data.registrationNumber}' already exists`,
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.CONFLICT
      );
    }

    const vehicle = await this.vehicleRepository.create(data);

    logger.info('Vehicle Created', { vehicleId: vehicle.id, registrationNumber: vehicle.registrationNumber, createdBy: userId });

    await writeAuditLog({
      userId,
      action: 'VEHICLE_CREATE',
      resource: 'vehicles',
      resourceId: vehicle.id,
      ipAddress,
      userAgent,
      metadata: { registrationNumber: vehicle.registrationNumber },
    });

    return vehicle;
  }

  // ─── Update Vehicle ────────────────────────────────────────────────────────
  async updateVehicle(
    id: string,
    data: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Vehicle> {
    const vehicle = await this.getVehicleById(id);

    // Business Rule: A retired vehicle cannot become Available
    if (data.status === VehicleStatus.AVAILABLE && vehicle.status === VehicleStatus.RETIRED) {
      throw new AppError(
        'Business Rule Violation: A retired vehicle cannot be changed back to Available state.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Business Rule: Prevent odometer rollback
    if (data.currentOdometer !== undefined && data.currentOdometer < vehicle.currentOdometer) {
      throw new AppError(
        `Business Rule Violation: New odometer reading (${data.currentOdometer} km) cannot be less than current stored value (${vehicle.currentOdometer} km).`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Unique registration check if registrationNumber is changing
    if (data.registrationNumber && data.registrationNumber.toUpperCase().trim() !== vehicle.registrationNumber) {
      const existing = await this.vehicleRepository.findByRegistrationNumber(data.registrationNumber);
      if (existing) {
        throw new AppError(
          `Vehicle with registration number '${data.registrationNumber}' already exists`,
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.CONFLICT
        );
      }
    }

    const updatedVehicle = await this.vehicleRepository.update(id, data);

    logger.info('Vehicle Updated', { vehicleId: id, updatedBy: userId });

    await writeAuditLog({
      userId,
      action: 'VEHICLE_UPDATE',
      resource: 'vehicles',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { changes: data },
    });

    return updatedVehicle;
  }

  // ─── Update Vehicle Status ─────────────────────────────────────────────────
  async updateVehicleStatus(
    id: string,
    status: VehicleStatus,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Vehicle> {
    const vehicle = await this.getVehicleById(id);

    // Business Rule: A retired vehicle cannot become Available
    if (status === VehicleStatus.AVAILABLE && vehicle.status === VehicleStatus.RETIRED) {
      throw new AppError(
        'Business Rule Violation: A retired vehicle cannot be changed back to Available state.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const updatedVehicle = await this.vehicleRepository.update(id, { status });

    logger.info('Status Changed', { vehicleId: id, oldStatus: vehicle.status, newStatus: status, updatedBy: userId });

    await writeAuditLog({
      userId,
      action: 'VEHICLE_STATUS_CHANGE',
      resource: 'vehicles',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { oldStatus: vehicle.status, newStatus: status },
    });

    return updatedVehicle;
  }

  // ─── Delete Vehicle ────────────────────────────────────────────────────────
  async deleteVehicle(
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const vehicle = await this.getVehicleById(id);

    // Business Rule: Vehicle in OnTrip cannot be deleted
    if (vehicle.status === VehicleStatus.ON_TRIP) {
      throw new AppError(
        'Business Rule Violation: A vehicle currently on a trip cannot be deleted.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    await this.vehicleRepository.delete(id);

    logger.info('Vehicle Deleted', { vehicleId: id, deletedBy: userId });

    await writeAuditLog({
      userId,
      action: 'VEHICLE_DELETE',
      resource: 'vehicles',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { registrationNumber: vehicle.registrationNumber },
    });
  }
}
