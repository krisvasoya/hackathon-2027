import { Maintenance, MaintenanceStatus, Prisma } from '@prisma/client';
import { prisma } from '../database/client';

export interface GetMaintenanceParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: MaintenanceStatus;
  vehicleId?: string;
  priority?: string;
  maintenanceType?: string;
}

export class MaintenanceRepository {
  private buildWhereClause(params: Omit<GetMaintenanceParams, 'page' | 'limit'>): Prisma.MaintenanceWhereInput {
    const where: Prisma.MaintenanceWhereInput = {};

    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { maintenanceNumber: { contains: term, mode: 'insensitive' } },
        { workshopName: { contains: term, mode: 'insensitive' } },
        { technicianName: { contains: term, mode: 'insensitive' } },
        { vehicle: { vehicleName: { contains: term, mode: 'insensitive' } } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.vehicleId) {
      where.vehicleId = params.vehicleId;
    }

    if (params.priority) {
      where.priority = params.priority;
    }

    if (params.maintenanceType) {
      where.maintenanceType = params.maintenanceType;
    }

    return where;
  }

  async findMany(params: GetMaintenanceParams): Promise<any[]> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', ...filterParams } = params;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filterParams);

    const allowedSortFields = [
      'maintenanceNumber',
      'maintenanceType',
      'priority',
      'scheduledDate',
      'completedDate',
      'estimatedCost',
      'actualCost',
      'status',
      'createdAt',
    ];

    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    return prisma.maintenance.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [actualSortBy]: sortOrder,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            vehicleName: true,
            status: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async count(params: Omit<GetMaintenanceParams, 'page' | 'limit'>): Promise<number> {
    const where = this.buildWhereClause(params);
    return prisma.maintenance.count({ where });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.maintenance.findUnique({
      where: { id },
      include: {
        vehicle: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByMaintenanceNumber(maintenanceNumber: string): Promise<Maintenance | null> {
    return prisma.maintenance.findUnique({
      where: { maintenanceNumber: maintenanceNumber.toUpperCase().trim() },
    });
  }

  async create(data: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>): Promise<Maintenance> {
    return prisma.maintenance.create({
      data: {
        ...data,
        maintenanceNumber: data.maintenanceNumber.toUpperCase().trim(),
      },
    });
  }

  async update(id: string, data: Partial<Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Maintenance> {
    return prisma.maintenance.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Maintenance> {
    return prisma.maintenance.delete({
      where: { id },
    });
  }

  // ─── Transactional Maintenance Actions ─────────────────────────────────────
  
  // Create maintenance and set vehicle status to IN_SHOP atomically
  async executeCreateInShopTransaction(
    maintenanceData: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Maintenance> {
    return prisma.$transaction(async (tx) => {
      // 1. Lock vehicle status -> IN_SHOP
      await tx.vehicle.update({
        where: { id: maintenanceData.vehicleId },
        data: { status: 'IN_SHOP' },
      });

      // 2. Register maintenance log
      return tx.maintenance.create({
        data: {
          ...maintenanceData,
          maintenanceNumber: maintenanceData.maintenanceNumber.toUpperCase().trim(),
        },
      });
    });
  }

  // Set maintenance status to COMPLETED and vehicle -> AVAILABLE atomically
  async executeCompleteMaintenanceTransaction(params: {
    maintenanceId: string;
    vehicleId: string;
    actualCost: number;
    completedDate: Date;
    notes?: string | null;
    creatorUserId: string;
    maintenanceNumber: string;
  }): Promise<Maintenance> {
    return prisma.$transaction(async (tx) => {
      // 1. Query vehicle status. If retired, do NOT change it back to AVAILABLE
      const vehicle = await tx.vehicle.findUnique({
        where: { id: params.vehicleId },
        select: { status: true },
      });

      if (vehicle && vehicle.status !== 'RETIRED') {
        await tx.vehicle.update({
          where: { id: params.vehicleId },
          data: { status: 'AVAILABLE' },
        });
      }

      // 2. Add an Expense log automatically of type Maintenance
      if (params.actualCost > 0) {
        await tx.expense.create({
          data: {
            vehicleId: params.vehicleId,
            expenseType: 'Maintenance',
            amount: params.actualCost,
            description: `Auto-recorded expense for maintenance ticket: ${params.maintenanceNumber}`,
            date: params.completedDate,
          },
        });
      }

      // 3. Update maintenance log
      return tx.maintenance.update({
        where: { id: params.maintenanceId },
        data: {
          status: 'COMPLETED',
          actualCost: params.actualCost,
          completedDate: params.completedDate,
          notes: params.notes,
        },
      });
    });
  }

  // Set maintenance status to CANCELLED and release vehicle -> AVAILABLE atomically
  async executeCancelMaintenanceTransaction(
    maintenanceId: string,
    vehicleId: string
  ): Promise<Maintenance> {
    return prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: vehicleId },
        select: { status: true },
      });

      if (vehicle && vehicle.status !== 'RETIRED') {
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: { status: 'AVAILABLE' },
        });
      }

      return tx.maintenance.update({
        where: { id: maintenanceId },
        data: { status: 'CANCELLED' },
      });
    });
  }
}
