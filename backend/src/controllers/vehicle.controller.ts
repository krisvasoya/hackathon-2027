import { Request, Response, NextFunction } from 'express';
import { VehicleService } from '../services/vehicle.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.util';
import { PAGINATION } from '../constants';
import { VehicleStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

export class VehicleController {
  private readonly vehicleService: VehicleService;

  constructor() {
    this.vehicleService = new VehicleService();
  }

  // ─── GET /api/vehicles ────────────────────────────────────────────────────
  getVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit as string, 10) || PAGINATION.DEFAULT_LIMIT;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      const search = req.query.search as string;
      const status = req.query.status as VehicleStatus;
      const type = req.query.type as string;
      const region = req.query.region as string;

      const result = await this.vehicleService.getVehicles({
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        status,
        type,
        region,
      });

      sendSuccess(res, result, 'Vehicles retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── GET /api/vehicles/:id ────────────────────────────────────────────────
  getVehicleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const vehicle = await this.vehicleService.getVehicleById(id);
      sendSuccess(res, vehicle, 'Vehicle retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── POST /api/vehicles ───────────────────────────────────────────────────
  createVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      // Parse manufacturingYear, capacity and costs to ensure proper numbers
      const body = req.body;
      const vehicleData = {
        registrationNumber: body.registrationNumber,
        vehicleName: body.vehicleName,
        vehicleModel: body.vehicleModel,
        vehicleType: body.vehicleType,
        manufacturer: body.manufacturer,
        manufacturingYear: parseInt(body.manufacturingYear, 10),
        maximumLoadCapacity: parseFloat(body.maximumLoadCapacity),
        currentOdometer: parseFloat(body.currentOdometer),
        acquisitionCost: new PrismaDecimalWrapper(body.acquisitionCost), // Prisma expects decimal wrapper or number/string representation
        purchaseDate: new Date(body.purchaseDate),
        insuranceExpiry: new Date(body.insuranceExpiry),
        registrationExpiry: new Date(body.registrationExpiry),
        status: (body.status as VehicleStatus) || VehicleStatus.AVAILABLE,
        region: body.region,
        notes: body.notes || null,
      } as any; // Cast safely for repository creation

      const vehicle = await this.vehicleService.createVehicle(vehicleData, userId, ipAddress, userAgent);
      sendCreated(res, vehicle, 'Vehicle registered successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── PUT /api/vehicles/:id ────────────────────────────────────────────────
  updateVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const body = req.body;
      const updateData: any = {};

      if (body.registrationNumber !== undefined) updateData.registrationNumber = body.registrationNumber;
      if (body.vehicleName !== undefined) updateData.vehicleName = body.vehicleName;
      if (body.vehicleModel !== undefined) updateData.vehicleModel = body.vehicleModel;
      if (body.vehicleType !== undefined) updateData.vehicleType = body.vehicleType;
      if (body.manufacturer !== undefined) updateData.manufacturer = body.manufacturer;
      if (body.manufacturingYear !== undefined) updateData.manufacturingYear = parseInt(body.manufacturingYear, 10);
      if (body.maximumLoadCapacity !== undefined) updateData.maximumLoadCapacity = parseFloat(body.maximumLoadCapacity);
      if (body.currentOdometer !== undefined) updateData.currentOdometer = parseFloat(body.currentOdometer);
      if (body.acquisitionCost !== undefined) updateData.acquisitionCost = new PrismaDecimalWrapper(body.acquisitionCost);
      if (body.purchaseDate !== undefined) updateData.purchaseDate = new Date(body.purchaseDate);
      if (body.insuranceExpiry !== undefined) updateData.insuranceExpiry = new Date(body.insuranceExpiry);
      if (body.registrationExpiry !== undefined) updateData.registrationExpiry = new Date(body.registrationExpiry);
      if (body.status !== undefined) updateData.status = body.status as VehicleStatus;
      if (body.region !== undefined) updateData.region = body.region;
      if (body.notes !== undefined) updateData.notes = body.notes || null;

      const vehicle = await this.vehicleService.updateVehicle(id, updateData, userId, ipAddress, userAgent);
      sendSuccess(res, vehicle, 'Vehicle details updated successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── PATCH /api/vehicles/:id/status ───────────────────────────────────────
  updateVehicleStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status } = req.body as { status: VehicleStatus };
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const vehicle = await this.vehicleService.updateVehicleStatus(id, status, userId, ipAddress, userAgent);
      sendSuccess(res, vehicle, 'Vehicle status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── DELETE /api/vehicles/:id ─────────────────────────────────────────────
  deleteVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      await this.vehicleService.deleteVehicle(id, userId, ipAddress, userAgent);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };
}

// Helper class for Prisma Decimal values mapping
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
