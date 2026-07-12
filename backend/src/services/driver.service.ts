import { Driver, DriverStatus } from '@prisma/client';
import { DriverRepository, GetDriversParams } from '../repositories/driver.repository';
import { AppError } from '../utils/app-error.util';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { logger } from '../config/logger';
import { writeAuditLog } from '../utils/audit.util';
import { PaginatedResult } from '../types';

export class DriverService {
  private readonly driverRepository: DriverRepository;

  constructor() {
    this.driverRepository = new DriverRepository();
  }

  // Helper to validate license expiry
  private validateLicenseExpiry(expiryDate: Date, status: DriverStatus) {
    if (status === DriverStatus.AVAILABLE && new Date(expiryDate) < new Date()) {
      throw new AppError(
        'Business Rule Violation: Drivers with expired licenses cannot be set to AVAILABLE status.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
  }

  // Helper to validate safety score bounds
  private validateSafetyScore(score: number) {
    if (score < 0 || score > 100) {
      throw new AppError(
        'Business Rule Violation: Safety score must remain between 0 and 100.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
  }

  // ─── Get All Drivers (Paginated, Sorted, Filtered) ─────────────────────────
  async getDrivers(params: GetDriversParams): Promise<PaginatedResult<Driver>> {
    const data = await this.driverRepository.findMany(params);
    const total = await this.driverRepository.count(params);

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

  // ─── Get Driver By ID ──────────────────────────────────────────────────────
  async getDriverById(id: string): Promise<Driver> {
    const driver = await this.driverRepository.findById(id);
    if (!driver) {
      throw new AppError('Driver not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return driver;
  }

  // ─── Create Driver ─────────────────────────────────────────────────────────
  async createDriver(
    data: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Driver> {
    // 1. Business Rule: Unique license number check
    const existingLicense = await this.driverRepository.findByLicenseNumber(data.licenseNumber);
    if (existingLicense) {
      throw new AppError(
        `Driver with license number '${data.licenseNumber}' already exists`,
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.CONFLICT
      );
    }

    // 2. Business Rule: Unique employee ID check (if provided)
    if (data.employeeId) {
      const existingEmployee = await this.driverRepository.findByEmployeeId(data.employeeId);
      if (existingEmployee) {
        throw new AppError(
          `Driver with employee ID '${data.employeeId}' already exists`,
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.CONFLICT
        );
      }
    }

    // 3. Business Rule: Safety score between 0 and 100
    this.validateSafetyScore(data.safetyScore);

    // 4. Business Rule: Expired licenses cannot be set to AVAILABLE
    this.validateLicenseExpiry(data.licenseExpiryDate, data.status);

    const driver = await this.driverRepository.create(data);

    logger.info('Driver Created', { driverId: driver.id, employeeId: driver.employeeId, createdBy: userId });

    await writeAuditLog({
      userId,
      action: 'DRIVER_CREATE',
      resource: 'drivers',
      resourceId: driver.id,
      ipAddress,
      userAgent,
      metadata: { licenseNumber: driver.licenseNumber, employeeId: driver.employeeId },
    });

    return driver;
  }

  // ─── Update Driver ─────────────────────────────────────────────────────────
  async updateDriver(
    id: string,
    data: Partial<Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Driver> {
    const driver = await this.getDriverById(id);

    // 1. Unique license check if changing
    if (data.licenseNumber && data.licenseNumber.toUpperCase().trim() !== driver.licenseNumber) {
      const existingLicense = await this.driverRepository.findByLicenseNumber(data.licenseNumber);
      if (existingLicense) {
        throw new AppError(
          `Driver with license number '${data.licenseNumber}' already exists`,
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.CONFLICT
        );
      }
    }

    // 2. Unique employee ID check if changing
    if (data.employeeId && data.employeeId.trim() !== driver.employeeId) {
      const existingEmployee = await this.driverRepository.findByEmployeeId(data.employeeId);
      if (existingEmployee) {
        throw new AppError(
          `Driver with employee ID '${data.employeeId}' already exists`,
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.CONFLICT
        );
      }
    }

    // 3. Safety score check
    if (data.safetyScore !== undefined) {
      this.validateSafetyScore(data.safetyScore);
    }

    // 4. Expired license state transition checks
    const targetStatus = data.status ?? driver.status;
    const targetExpiry = data.licenseExpiryDate ?? driver.licenseExpiryDate;
    this.validateLicenseExpiry(targetExpiry, targetStatus);

    // 5. Business Rule: Suspended drivers cannot be assigned to trips
    if (targetStatus === DriverStatus.ON_TRIP && targetStatus !== driver.status && driver.status === DriverStatus.SUSPENDED) {
      throw new AppError(
        'Business Rule Violation: A suspended driver cannot be assigned to an active trip.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const updatedDriver = await this.driverRepository.update(id, data);

    logger.info('Driver Updated', { driverId: id, updatedBy: userId });

    await writeAuditLog({
      userId,
      action: 'DRIVER_UPDATE',
      resource: 'drivers',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { changes: data },
    });

    return updatedDriver;
  }

  // ─── Update Driver Status ──────────────────────────────────────────────────
  async updateDriverStatus(
    id: string,
    status: DriverStatus,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Driver> {
    const driver = await this.getDriverById(id);

    // 1. Expired license state checks
    this.validateLicenseExpiry(driver.licenseExpiryDate, status);

    // 2. Suspended drivers trip bounds checks
    if (status === DriverStatus.ON_TRIP && driver.status === DriverStatus.SUSPENDED) {
      throw new AppError(
        'Business Rule Violation: A suspended driver cannot be assigned to an active trip.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const updatedDriver = await this.driverRepository.update(id, { status });

    logger.info('Status Changed', { driverId: id, oldStatus: driver.status, newStatus: status, updatedBy: userId });

    await writeAuditLog({
      userId,
      action: 'DRIVER_STATUS_CHANGE',
      resource: 'drivers',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { oldStatus: driver.status, newStatus: status },
    });

    return updatedDriver;
  }

  // ─── Delete Driver ─────────────────────────────────────────────────────────
  async deleteDriver(
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const driver = await this.getDriverById(id);

    // Business Rule: ON_TRIP drivers cannot be deleted
    if (driver.status === DriverStatus.ON_TRIP) {
      throw new AppError(
        'Business Rule Violation: A driver currently on a trip cannot be deleted.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    await this.driverRepository.delete(id);

    logger.info('Driver Deleted', { driverId: id, deletedBy: userId });

    await writeAuditLog({
      userId,
      action: 'DRIVER_DELETE',
      resource: 'drivers',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { fullName: driver.fullName, licenseNumber: driver.licenseNumber },
    });
  }
}
