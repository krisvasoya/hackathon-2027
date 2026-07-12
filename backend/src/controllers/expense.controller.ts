import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expense.service';
import { sendSuccess, sendCreated } from '../utils/response.util';
import { PAGINATION } from '../constants';
import { AuthenticatedRequest } from '../types';

export class ExpenseController {
  private readonly expenseService: ExpenseService;

  constructor() {
    this.expenseService = new ExpenseService();
  }

  getExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit as string, 10) || PAGINATION.DEFAULT_LIMIT;
      const sortBy = (req.query.sortBy as string) || 'date';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      const search = req.query.search as string;
      const vehicleId = req.query.vehicleId as string;
      const tripId = req.query.tripId as string;
      const expenseType = req.query.expenseType as string;
      const startDate = req.query.startDate as Date | undefined;
      const endDate = req.query.endDate as Date | undefined;

      const result = await this.expenseService.getExpenses({
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        vehicleId,
        tripId,
        expenseType,
        startDate,
        endDate,
      });

      sendSuccess(res, result, 'Expenses ledger retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getExpenseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const expense = await this.expenseService.getExpenseById(id);
      sendSuccess(res, expense, 'Expense ledger entry retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const body = req.body;
      const expenseData = {
        vehicleId: body.vehicleId,
        tripId: body.tripId || null,
        expenseType: body.expenseType,
        amount: new PrismaDecimalWrapper(body.amount),
        description: body.description,
        date: new Date(body.date),
      } as any;

      const result = await this.expenseService.createExpense(expenseData, userId, ipAddress, userAgent);
      sendCreated(res, result, 'Expense registered in ledger successfully');
    } catch (error) {
      next(error);
    }
  };

  updateExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const body = req.body;
      const updateData: any = {};

      if (body.vehicleId !== undefined) updateData.vehicleId = body.vehicleId;
      if (body.tripId !== undefined) updateData.tripId = body.tripId || null;
      if (body.expenseType !== undefined) updateData.expenseType = body.expenseType;
      if (body.amount !== undefined) updateData.amount = new PrismaDecimalWrapper(body.amount);
      if (body.description !== undefined) updateData.description = body.description;
      if (body.date !== undefined) updateData.date = new Date(body.date);

      const result = await this.expenseService.updateExpense(id, updateData, userId, ipAddress, userAgent);
      sendSuccess(res, result, 'Expense ledger entry updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      await this.expenseService.deleteExpense(id, userId, ipAddress, userAgent);
      sendSuccess(res, null, 'Expense ledger entry deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getVehicleFinancials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleId = req.params.vehicleId as string;
      const stats = await this.expenseService.getVehicleStats(vehicleId);
      sendSuccess(res, stats, 'Vehicle operational cost and ROI aggregates calculated');
    } catch (error) {
      next(error);
    }
  };
}

class PrismaDecimalWrapper {
  private readonly value: string;
  constructor(val: string | number) {
    this.value = String(val);
  }
  toJSON() {
    return this.value;
  }
  toString() {
    return this.value;
  }
}
