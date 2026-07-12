import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from '../services/maintenance.service';
import { sendSuccess, sendCreated } from '../utils/response.util';
import { PAGINATION } from '../constants';
import { MaintenanceStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

export class MaintenanceController {
  private readonly maintenanceService: MaintenanceService;

  constructor() {
    this.maintenanceService = new MaintenanceService();
  }

  getMaintenances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit as string, 10) || PAGINATION.DEFAULT_LIMIT;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      const search = req.query.search as string;
      const status = req.query.status as MaintenanceStatus;
      const vehicleId = req.query.vehicleId as string;
      const priority = req.query.priority as string;
      const maintenanceType = req.query.maintenanceType as string;

      const result = await this.maintenanceService.getMaintenances({
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        status,
        vehicleId,
        priority,
        maintenanceType,
      });

      sendSuccess(res, result, 'Maintenance tickets retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getMaintenanceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const log = await this.maintenanceService.getMaintenanceById(id);
      sendSuccess(res, log, 'Maintenance ticket retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  createMaintenance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const body = req.body;
      const maintenanceData = {
        vehicleId: body.vehicleId,
        maintenanceType: body.maintenanceType,
        description: body.description,
        priority: body.priority,
        scheduledDate: new Date(body.scheduledDate),
        estimatedCost: new PrismaDecimalWrapper(body.estimatedCost),
        workshopName: body.workshopName,
        technicianName: body.technicianName,
        notes: body.notes || null,
      } as any;

      const result = await this.maintenanceService.createMaintenance(maintenanceData, userId, ipAddress, userAgent);
      sendCreated(res, result, 'Maintenance ticket scheduled successfully');
    } catch (error) {
      next(error);
    }
  };

  updateMaintenance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const body = req.body;
      const updateData: any = {};

      if (body.maintenanceType !== undefined) updateData.maintenanceType = body.maintenanceType;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.priority !== undefined) updateData.priority = body.priority;
      if (body.scheduledDate !== undefined) updateData.scheduledDate = new Date(body.scheduledDate);
      if (body.estimatedCost !== undefined) updateData.estimatedCost = new PrismaDecimalWrapper(body.estimatedCost);
      if (body.workshopName !== undefined) updateData.workshopName = body.workshopName;
      if (body.technicianName !== undefined) updateData.technicianName = body.technicianName;
      if (body.notes !== undefined) updateData.notes = body.notes || null;

      const result = await this.maintenanceService.updateMaintenance(id, updateData, userId, ipAddress, userAgent);
      sendSuccess(res, result, 'Maintenance ticket updated successfully');
    } catch (error) {
      next(error);
    }
  };

  startMaintenance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const result = await this.maintenanceService.startMaintenance(id, userId, ipAddress, userAgent);
      sendSuccess(res, result, 'Maintenance initiated. Vehicle set to IN SHOP.');
    } catch (error) {
      next(error);
    }
  };

  completeMaintenance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { actualCost, completedDate, notes } = req.body;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const result = await this.maintenanceService.completeMaintenance(
        id,
        parseFloat(actualCost),
        new Date(completedDate),
        notes || null,
        userId,
        ipAddress,
        userAgent
      );
      sendSuccess(res, result, 'Maintenance completed successfully. Cost registered in expenses.');
    } catch (error) {
      next(error);
    }
  };

  cancelMaintenance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const result = await this.maintenanceService.cancelMaintenance(id, userId, ipAddress, userAgent);
      sendSuccess(res, result, 'Maintenance ticket cancelled.');
    } catch (error) {
      next(error);
    }
  };

  deleteMaintenance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      await this.maintenanceService.deleteMaintenance(id, userId, ipAddress, userAgent);
      sendSuccess(res, null, 'Maintenance ticket record deleted successfully');
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
