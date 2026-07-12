import { FuelLog, Prisma } from '@prisma/client';
import { prisma } from '../database/client';

export interface GetFuelLogParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  vehicleId?: string;
  tripId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class FuelRepository {
  private buildWhereClause(params: Omit<GetFuelLogParams, 'page' | 'limit'>): Prisma.FuelLogWhereInput {
    const where: Prisma.FuelLogWhereInput = {};

    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { fuelStation: { contains: term, mode: 'insensitive' } },
        { vehicle: { vehicleName: { contains: term, mode: 'insensitive' } } },
      ];
    }

    if (params.vehicleId) {
      where.vehicleId = params.vehicleId;
    }

    if (params.tripId) {
      where.tripId = params.tripId;
    }

    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) {
        where.date.gte = params.startDate;
      }
      if (params.endDate) {
        where.date.lte = params.endDate;
      }
    }

    return where;
  }

  async findMany(params: GetFuelLogParams): Promise<any[]> {
    const { page, limit, sortBy = 'date', sortOrder = 'desc', ...filterParams } = params;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filterParams);

    const allowedSortFields = [
      'liters',
      'pricePerLiter',
      'totalCost',
      'odometer',
      'fuelStation',
      'date',
      'createdAt',
    ];

    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'date';

    return prisma.fuelLog.findMany({
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
          },
        },
        trip: {
          select: {
            id: true,
            tripNumber: true,
            source: true,
            destination: true,
          },
        },
      },
    });
  }

  async count(params: Omit<GetFuelLogParams, 'page' | 'limit'>): Promise<number> {
    const where = this.buildWhereClause(params);
    return prisma.fuelLog.count({ where });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.fuelLog.findUnique({
      where: { id },
      include: {
        vehicle: true,
        trip: true,
      },
    });
  }

  // ─── Transactional Fuel Actions ───
  // We synchronize fuel logs and expense records automatically

  async executeCreateFuelLogTransaction(data: Omit<FuelLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<FuelLog> {
    return prisma.$transaction(async (tx) => {
      // 1. Create fuel log
      const fuelLog = await tx.fuelLog.create({ data });

      // 2. Create matching expense
      await tx.expense.create({
        data: {
          id: fuelLog.id, // Keep the same ID for ease of matching, editing, and deleting
          vehicleId: data.vehicleId,
          tripId: data.tripId,
          expenseType: 'Fuel',
          amount: data.totalCost,
          description: `Auto-recorded fuel at ${data.fuelStation} (${data.liters}L @ $${data.pricePerLiter}/L)`,
          date: data.date,
        },
      });

      return fuelLog;
    });
  }

  async executeUpdateFuelLogTransaction(
    id: string,
    data: Partial<Omit<FuelLog, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<FuelLog> {
    return prisma.$transaction(async (tx) => {
      // 1. Update fuel log
      const fuelLog = await tx.fuelLog.update({
        where: { id },
        data,
      });

      // 2. Update matching expense
      const expenseData: any = {};
      if (data.vehicleId !== undefined) expenseData.vehicleId = data.vehicleId;
      if (data.tripId !== undefined) expenseData.tripId = data.tripId;
      if (data.totalCost !== undefined) expenseData.amount = data.totalCost;
      if (data.date !== undefined) expenseData.date = data.date;
      expenseData.description = `Auto-recorded fuel at ${fuelLog.fuelStation} (${fuelLog.liters}L @ $${fuelLog.pricePerLiter}/L)`;

      await tx.expense.update({
        where: { id }, // Uses the synchronized ID
        data: expenseData,
      });

      return fuelLog;
    });
  }

  async executeDeleteFuelLogTransaction(id: string): Promise<FuelLog> {
    return prisma.$transaction(async (tx) => {
      // Delete matching expense first
      await tx.expense.delete({ where: { id } }).catch(() => {
        // Safe catch in case expense was already deleted manually
      });

      // Delete fuel log
      return tx.fuelLog.delete({
        where: { id },
      });
    });
  }
}
