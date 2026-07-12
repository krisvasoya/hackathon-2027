import { Request, Response, NextFunction } from 'express';
import { DriverService } from '../services/driver.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.util';
import { PAGINATION } from '../constants';
import { DriverStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

export class DriverController {
  private readonly driverService: DriverService;

  constructor() {
    this.driverService = new DriverService();
  }

  // ─── GET /api/drivers ─────────────────────────────────────────────────────
  getDrivers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit as string, 10) || PAGINATION.DEFAULT_LIMIT;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      const search = req.query.search as string;
      const status = req.query.status as DriverStatus;
      const licenseCategory = req.query.licenseCategory as string;
      const minSafetyScore = req.query.minSafetyScore ? parseInt(req.query.minSafetyScore as string, 10) : undefined;
      const maxSafetyScore = req.query.maxSafetyScore ? parseInt(req.query.maxSafetyScore as string, 10) : undefined;
      const licenseExpiryBefore = req.query.licenseExpiryBefore ? new Date(req.query.licenseExpiryBefore as string) : undefined;

      const result = await this.driverService.getDrivers({
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        status,
        licenseCategory,
        minSafetyScore,
        maxSafetyScore,
        licenseExpiryBefore,
      });

      sendSuccess(res, result, 'Drivers retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── GET /api/drivers/:id ─────────────────────────────────────────────────
  getDriverById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const driver = await this.driverService.getDriverById(id);
      sendSuccess(res, driver, 'Driver retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── POST /api/drivers ────────────────────────────────────────────────────
  createDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const body = req.body;
      const driverData = {
        fullName: body.fullName,
        employeeId: body.employeeId || null,
        licenseNumber: body.licenseNumber,
        licenseCategory: body.licenseCategory,
        licenseExpiryDate: new Date(body.licenseExpiryDate),
        phoneNumber: body.phoneNumber,
        email: body.email,
        safetyScore: body.safetyScore !== undefined ? parseInt(body.safetyScore, 10) : 100,
        yearsOfExperience: parseInt(body.yearsOfExperience, 10),
        address: body.address,
        emergencyContact: body.emergencyContact,
        status: (body.status as DriverStatus) || DriverStatus.AVAILABLE,
        notes: body.notes || null,
      } as any;

      const driver = await this.driverService.createDriver(driverData, userId, ipAddress, userAgent);
      sendCreated(res, driver, 'Driver registered successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── PUT /api/drivers/:id ─────────────────────────────────────────────────
  updateDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const body = req.body;
      const updateData: any = {};

      if (body.fullName !== undefined) updateData.fullName = body.fullName;
      if (body.employeeId !== undefined) updateData.employeeId = body.employeeId || null;
      if (body.licenseNumber !== undefined) updateData.licenseNumber = body.licenseNumber;
      if (body.licenseCategory !== undefined) updateData.licenseCategory = body.licenseCategory;
      if (body.licenseExpiryDate !== undefined) updateData.licenseExpiryDate = new Date(body.licenseExpiryDate);
      if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.safetyScore !== undefined) updateData.safetyScore = parseInt(body.safetyScore, 10);
      if (body.yearsOfExperience !== undefined) updateData.yearsOfExperience = parseInt(body.yearsOfExperience, 10);
      if (body.address !== undefined) updateData.address = body.address;
      if (body.emergencyContact !== undefined) updateData.emergencyContact = body.emergencyContact;
      if (body.status !== undefined) updateData.status = body.status as DriverStatus;
      if (body.notes !== undefined) updateData.notes = body.notes || null;

      const driver = await this.driverService.updateDriver(id, updateData, userId, ipAddress, userAgent);
      sendSuccess(res, driver, 'Driver details updated successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── PATCH /api/drivers/:id/status ────────────────────────────────────────
  updateDriverStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status } = req.body as { status: DriverStatus };
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const driver = await this.driverService.updateDriverStatus(id, status, userId, ipAddress, userAgent);
      sendSuccess(res, driver, 'Driver status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── DELETE /api/drivers/:id ──────────────────────────────────────────────
  deleteDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      await this.driverService.deleteDriver(id, userId, ipAddress, userAgent);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };
}
