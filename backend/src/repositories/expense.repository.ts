import { Expense, Prisma } from '@prisma/client';
import { prisma } from '../database/client';

export interface GetExpenseParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  vehicleId?: string;
  tripId?: string;
  expenseType?: string;
  startDate?: Date;
  endDate?: Date;
}

export class ExpenseRepository {
  private buildWhereClause(params: Omit<GetExpenseParams, 'page' | 'limit'>): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = {};

    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { description: { contains: term, mode: 'insensitive' } },
        { expenseType: { contains: term, mode: 'insensitive' } },
        { vehicle: { vehicleName: { contains: term, mode: 'insensitive' } } },
      ];
    }

    if (params.vehicleId) {
      where.vehicleId = params.vehicleId;
    }

    if (params.tripId) {
      where.tripId = params.tripId;
    }

    if (params.expenseType) {
      where.expenseType = params.expenseType;
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

  async findMany(params: GetExpenseParams): Promise<any[]> {
    const { page, limit, sortBy = 'date', sortOrder = 'desc', ...filterParams } = params;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filterParams);

    const allowedSortFields = [
      'expenseType',
      'amount',
      'date',
      'createdAt',
    ];

    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'date';

    return prisma.expense.findMany({
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

  async count(params: Omit<GetExpenseParams, 'page' | 'limit'>): Promise<number> {
    const where = this.buildWhereClause(params);
    return prisma.expense.count({ where });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.expense.findUnique({
      where: { id },
      include: {
        vehicle: true,
        trip: true,
      },
    });
  }

  async create(data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    return prisma.expense.create({ data });
  }

  async update(id: string, data: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Expense> {
    return prisma.expense.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Expense> {
    return prisma.expense.delete({
      where: { id },
    });
  }

  // Calculate stats for dynamic vehicle analysis:
  // Operational Cost = Fuel + Maintenance + Other
  // Vehicle ROI = Trip Revenue - Operational Cost
  async calculateVehicleStats(vehicleId: string): Promise<{
    totalFuel: number;
    totalMaintenance: number;
    totalToll: number;
    totalOther: number;
    totalOperationalCost: number;
    totalRevenue: number;
    roi: number;
  }> {
    // 1. Get sum of all expenses by category
    const expenses = await prisma.expense.groupBy({
      by: ['expenseType'],
      where: { vehicleId },
      _sum: {
        amount: true,
      },
    });

    let totalFuel = 0;
    let totalMaintenance = 0;
    let totalToll = 0;
    let totalOther = 0;
    let totalOperationalCost = 0;

    expenses.forEach((item: any) => {
      const amount = Number(item._sum.amount || 0);
      totalOperationalCost += amount;

      if (item.expenseType === 'Fuel') {
        totalFuel += amount;
      } else if (item.expenseType === 'Maintenance' || item.expenseType === 'Repair') {
        totalMaintenance += amount;
      } else if (item.expenseType === 'Toll') {
        totalToll += amount;
      } else {
        totalOther += amount;
      }
    });

    // 2. Get sum of all trip revenue associated with this vehicle
    const tripRevenueSum = await prisma.trip.aggregate({
      where: {
        vehicleId,
        status: 'COMPLETED',
      },
      _sum: {
        tripRevenue: true,
      },
    });

    const totalRevenue = Number(tripRevenueSum._sum.tripRevenue || 0);
    const roi = totalRevenue - totalOperationalCost;

    return {
      totalFuel,
      totalMaintenance,
      totalToll,
      totalOther,
      totalOperationalCost,
      totalRevenue,
      roi,
    };
  }
}
