import { Request, Response, NextFunction } from 'express';
import { FuelService } from '../services/fuel.service';
import { sendSuccess, sendCreated } from '../utils/response.util';
import { PAGINATION } from '../constants';
import { AuthenticatedRequest } from '../types';

export class FuelController {
  private readonly fuelService: FuelService;

  constructor() {
    this.fuelService = new FuelService();
  }

  getFuelLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit as string, 10) || PAGINATION.DEFAULT_LIMIT;
      const sortBy = (req.query.sortBy as string) || 'date';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      const search = req.query.search as string;
      const vehicleId = req.query.vehicleId as string;
      const tripId = req.query.tripId as string;
      const startDate = req.query.startDate as Date | undefined;
      const endDate = req.query.endDate as Date | undefined;

      const result = await this.fuelService.getFuelLogs({
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        vehicleId,
        tripId,
        startDate,
        endDate,
      });

      sendSuccess(res, result, 'Fuel logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getFuelLogById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const log = await this.fuelService.getFuelLogById(id);
      sendSuccess(res, log, 'Fuel log retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  createFuelLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const body = req.body;
      const fuelData = {
        vehicleId: body.vehicleId,
        tripId: body.tripId || null,
        liters: parseFloat(body.liters),
        pricePerLiter: parseFloat(body.pricePerLiter),
        totalCost: new PrismaDecimalWrapper(body.totalCost),
        odometer: parseFloat(body.odometer),
        fuelStation: body.fuelStation,
        date: new Date(body.date),
      } as any;

      const result = await this.fuelService.createFuelLog(fuelData, userId, ipAddress, userAgent);
      sendCreated(res, result, 'Fuel log receipt registered successfully');
    } catch (error) {
      next(error);
    }
  };

  updateFuelLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      if (body.liters !== undefined) updateData.liters = parseFloat(body.liters);
      if (body.pricePerLiter !== undefined) updateData.pricePerLiter = parseFloat(body.pricePerLiter);
      if (body.totalCost !== undefined) updateData.totalCost = new PrismaDecimalWrapper(body.totalCost);
      if (body.odometer !== undefined) updateData.odometer = parseFloat(body.odometer);
      if (body.fuelStation !== undefined) updateData.fuelStation = body.fuelStation;
      if (body.date !== undefined) updateData.date = new Date(body.date);

      const result = await this.fuelService.updateFuelLog(id, updateData, userId, ipAddress, userAgent);
      sendSuccess(res, result, 'Fuel log receipt updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteFuelLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      await this.fuelService.deleteFuelLog(id, userId, ipAddress, userAgent);
      sendSuccess(res, null, 'Fuel log receipt deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getFuelEfficiency = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleId = req.params.vehicleId as string;
      const efficiency = await this.fuelService.calculateFuelEfficiency(vehicleId);
      sendSuccess(res, efficiency, 'Fuel efficiency metrics calculated');
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
