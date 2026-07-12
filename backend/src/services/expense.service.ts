import { Expense } from '@prisma/client';
import { ExpenseRepository, GetExpenseParams } from '../repositories/expense.repository';
import { prisma } from '../database/client';
import { AppError } from '../utils/app-error.util';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { logger } from '../config/logger';
import { writeAuditLog } from '../utils/audit.util';
import { PaginatedResult } from '../types';

export class ExpenseService {
  private readonly expenseRepository: ExpenseRepository;

  constructor() {
    this.expenseRepository = new ExpenseRepository();
  }

  async getExpenses(params: GetExpenseParams): Promise<PaginatedResult<any>> {
    const data = await this.expenseRepository.findMany(params);
    const total = await this.expenseRepository.count(params);
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

  async getExpenseById(id: string): Promise<any> {
    const log = await this.expenseRepository.findById(id);
    if (!log) {
      throw new AppError('Expense record not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return log;
  }

  async createExpense(
    data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Expense> {
    // 1. Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) {
      throw new AppError('Vehicle not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    // 2. Business Rule: Expense amount cannot be negative
    if (Number(data.amount) < 0) {
      throw new AppError(
        'Business Rule Violation: Expense amount cannot be negative.',
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

    const expense = await this.expenseRepository.create(data);

    logger.info('Expense Registered', { expenseId: expense.id, type: data.expenseType, amount: data.amount });

    await writeAuditLog({
      userId,
      action: 'EXPENSE_CREATE',
      resource: 'expenses',
      resourceId: expense.id,
      ipAddress,
      userAgent,
      metadata: { vehicleId: data.vehicleId, expenseType: data.expenseType, amount: data.amount },
    });

    return expense;
  }

  async updateExpense(
    id: string,
    data: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Expense> {
    const expense = await this.getExpenseById(id);

    // Validate amount if modified
    const targetAmount = data.amount !== undefined ? data.amount : Number(expense.amount);
    if (Number(targetAmount) < 0) {
      throw new AppError(
        'Business Rule Violation: Expense amount cannot be negative.',
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

    const updated = await this.expenseRepository.update(id, data);

    logger.info('Expense Updated', { expenseId: id });

    await writeAuditLog({
      userId,
      action: 'EXPENSE_UPDATE',
      resource: 'expenses',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { changes: data },
    });

    return updated;
  }

  async deleteExpense(
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const expense = await this.getExpenseById(id);

    await this.expenseRepository.delete(id);

    logger.info('Expense Deleted', { expenseId: id, deletedBy: userId });

    await writeAuditLog({
      userId,
      action: 'EXPENSE_DELETE',
      resource: 'expenses',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { expenseType: expense.expenseType, amount: expense.amount },
    });
  }

  // Retrieve aggregate stats for a specific vehicle
  async getVehicleStats(vehicleId: string): Promise<any> {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new AppError('Vehicle not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return this.expenseRepository.calculateVehicleStats(vehicleId);
  }
}
