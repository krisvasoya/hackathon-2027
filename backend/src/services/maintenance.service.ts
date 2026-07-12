import { Maintenance, MaintenanceStatus, VehicleStatus } from '@prisma/client';
import { MaintenanceRepository, GetMaintenanceParams } from '../repositories/maintenance.repository';
import { prisma } from '../database/client';
import { AppError } from '../utils/app-error.util';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { logger } from '../config/logger';
import { writeAuditLog } from '../utils/audit.util';
import { PaginatedResult } from '../types';

export class MaintenanceService {
  private readonly maintenanceRepository: MaintenanceRepository;

  constructor() {
    this.maintenanceRepository = new MaintenanceRepository();
  }

  // Generate ticket number: MNT-YYYYMMDD-XXXX
  private async generateMaintenanceNumber(): Promise<string> {
    const today = new Date();
    const yyyy = today.getFullYear().toString();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    const countToday = await prisma.maintenance.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lte: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });

    const sequence = String(countToday + 1).padStart(4, '0');
    return `MNT-${dateStr}-${sequence}`;
  }

  async getMaintenances(params: GetMaintenanceParams): Promise<PaginatedResult<any>> {
    const data = await this.maintenanceRepository.findMany(params);
    const total = await this.maintenanceRepository.count(params);
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

  async getMaintenanceById(id: string): Promise<any> {
    const log = await this.maintenanceRepository.findById(id);
    if (!log) {
      throw new AppError('Maintenance log not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return log;
  }

  // Create Maintenance (If PENDING/IN_PROGRESS, locks vehicle to IN_SHOP)
  async createMaintenance(
    data: Omit<Maintenance, 'id' | 'maintenanceNumber' | 'status' | 'completedDate' | 'actualCost' | 'createdAt' | 'updatedAt'>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Maintenance> {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) {
      throw new AppError('Vehicle not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    // Business Rule: Vehicle under active trip cannot be maintained
    if (vehicle.status === VehicleStatus.ON_TRIP) {
      throw new AppError(
        'Business Rule Violation: Vehicle is currently ON_TRIP. Finish the trip before scheduling maintenance.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Business Rule: Retired vehicles cannot be maintained
    if (vehicle.status === VehicleStatus.RETIRED) {
      throw new AppError(
        'Business Rule Violation: Retired vehicles cannot undergo maintenance.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const maintenanceNumber = await this.generateMaintenanceNumber();

    // Create log and transition vehicle to IN_SHOP atomically
    const maintenance = await this.maintenanceRepository.executeCreateInShopTransaction({
      ...data,
      maintenanceNumber,
      status: MaintenanceStatus.PENDING,
      completedDate: null,
      actualCost: null,
      createdBy: userId,
    });

    logger.info('Maintenance Created', { maintenanceId: maintenance.id, vehicleId: data.vehicleId });

    await writeAuditLog({
      userId,
      action: 'MAINTENANCE_CREATE',
      resource: 'maintenances',
      resourceId: maintenance.id,
      ipAddress,
      userAgent,
      metadata: { maintenanceNumber, vehicleId: data.vehicleId },
    });

    return maintenance;
  }

  // Update Maintenance (Only allowed in PENDING status)
  async updateMaintenance(
    id: string,
    data: Partial<Omit<Maintenance, 'id' | 'maintenanceNumber' | 'status' | 'completedDate' | 'actualCost' | 'createdAt' | 'updatedAt'>>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Maintenance> {
    const maintenance = await this.getMaintenanceById(id);

    if (maintenance.status !== MaintenanceStatus.PENDING) {
      throw new AppError(
        'Business Rule Violation: Only pending maintenance logs can be updated.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const updated = await this.maintenanceRepository.update(id, data);

    logger.info('Maintenance Updated', { maintenanceId: id });

    await writeAuditLog({
      userId,
      action: 'MAINTENANCE_UPDATE',
      resource: 'maintenances',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { changes: data },
    });

    return updated;
  }

  // Start Maintenance (Transition PENDING -> IN_PROGRESS)
  async startMaintenance(
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Maintenance> {
    const maintenance = await this.getMaintenanceById(id);

    if (maintenance.status !== MaintenanceStatus.PENDING) {
      throw new AppError(
        `Maintenance cannot be started (Current status: ${maintenance.status})`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Lock vehicle status to IN_SHOP
    await prisma.vehicle.update({
      where: { id: maintenance.vehicleId },
      data: { status: VehicleStatus.IN_SHOP },
    });

    const updated = await this.maintenanceRepository.update(id, {
      status: MaintenanceStatus.IN_PROGRESS,
    });

    logger.info('Maintenance Started', { maintenanceId: id });

    await writeAuditLog({
      userId,
      action: 'MAINTENANCE_START',
      resource: 'maintenances',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { maintenanceNumber: maintenance.maintenanceNumber },
    });

    return updated;
  }

  // Complete Maintenance (Transition to COMPLETED, release vehicle, write Expense)
  async completeMaintenance(
    id: string,
    actualCost: number,
    completedDate: Date,
    notes: string | null,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Maintenance> {
    const maintenance = await this.getMaintenanceById(id);

    if (maintenance.status === MaintenanceStatus.COMPLETED || maintenance.status === MaintenanceStatus.CANCELLED) {
      throw new AppError(
        `Maintenance ticket is already closed (Status: ${maintenance.status})`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (actualCost < 0) {
      throw new AppError('Actual cost cannot be negative.', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    // Atomically close maintenance, release vehicle to AVAILABLE (unless retired), and record Expense
    const updated = await this.maintenanceRepository.executeCompleteMaintenanceTransaction({
      maintenanceId: id,
      vehicleId: maintenance.vehicleId,
      actualCost,
      completedDate,
      notes,
      creatorUserId: userId,
      maintenanceNumber: maintenance.maintenanceNumber,
    });

    logger.info('Maintenance Completed', { maintenanceId: id, actualCost });

    await writeAuditLog({
      userId,
      action: 'MAINTENANCE_COMPLETE',
      resource: 'maintenances',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { maintenanceNumber: maintenance.maintenanceNumber, actualCost, completedDate },
    });

    return updated;
  }

  // Cancel Maintenance (Transition to CANCELLED, release vehicle)
  async cancelMaintenance(
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Maintenance> {
    const maintenance = await this.getMaintenanceById(id);

    if (maintenance.status === MaintenanceStatus.COMPLETED || maintenance.status === MaintenanceStatus.CANCELLED) {
      throw new AppError(
        `Closed maintenance tickets cannot be cancelled (Status: ${maintenance.status})`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const updated = await this.maintenanceRepository.executeCancelMaintenanceTransaction(
      id,
      maintenance.vehicleId
    );

    logger.info('Maintenance Cancelled', { maintenanceId: id });

    await writeAuditLog({
      userId,
      action: 'MAINTENANCE_CANCEL',
      resource: 'maintenances',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { maintenanceNumber: maintenance.maintenanceNumber },
    });

    return updated;
  }

  // Delete Maintenance record (Super Admin only - releases vehicle if active)
  async deleteMaintenance(
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const maintenance = await this.getMaintenanceById(id);

    // Release vehicle if the maintenance being deleted is active
    if (maintenance.status === MaintenanceStatus.PENDING || maintenance.status === MaintenanceStatus.IN_PROGRESS) {
      await prisma.vehicle.update({
        where: { id: maintenance.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      }).catch(() => {});
    }

    await this.maintenanceRepository.delete(id);

    logger.info('Maintenance Deleted', { maintenanceId: id, deletedBy: userId });

    await writeAuditLog({
      userId,
      action: 'MAINTENANCE_DELETE',
      resource: 'maintenances',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { maintenanceNumber: maintenance.maintenanceNumber },
    });
  }
}
