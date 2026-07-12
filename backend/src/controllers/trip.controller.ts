import { Request, Response, NextFunction } from 'express';
import { TripService } from '../services/trip.service';
import { sendSuccess, sendCreated } from '../utils/response.util';
import { PAGINATION } from '../constants';
import { TripStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

export class TripController {
  private readonly tripService: TripService;

  constructor() {
    this.tripService = new TripService();
  }

  // ─── GET /api/trips ───────────────────────────────────────────────────────
  getTrips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit as string, 10) || PAGINATION.DEFAULT_LIMIT;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      const search = req.query.search as string;
      const status = req.query.status as TripStatus;
      const vehicleId = req.query.vehicleId as string;
      const driverId = req.query.driverId as string;
      const startDate = req.query.startDate as Date | undefined;
      const endDate = req.query.endDate as Date | undefined;

      const result = await this.tripService.getTrips({
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        status,
        vehicleId,
        driverId,
        startDate,
        endDate,
      });

      sendSuccess(res, result, 'Trips retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── GET /api/trips/:id ───────────────────────────────────────────────────
  getTripById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const trip = await this.tripService.getTripById(id);
      sendSuccess(res, trip, 'Trip retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── POST /api/trips ──────────────────────────────────────────────────────
  createTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const body = req.body;
      const tripData = {
        source: body.source,
        destination: body.destination,
        vehicleId: body.vehicleId,
        driverId: body.driverId,
        cargoWeight: parseFloat(body.cargoWeight),
        plannedDistance: parseFloat(body.plannedDistance),
        estimatedDuration: parseInt(body.estimatedDuration, 10),
        tripRevenue: new PrismaDecimalWrapper(body.tripRevenue),
        remarks: body.remarks || null,
      } as any;

      const trip = await this.tripService.createTrip(tripData, userId, ipAddress, userAgent);
      sendCreated(res, trip, 'Trip record registered successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── PUT /api/trips/:id ───────────────────────────────────────────────────
  updateTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const body = req.body;
      const updateData: any = {};

      if (body.source !== undefined) updateData.source = body.source;
      if (body.destination !== undefined) updateData.destination = body.destination;
      if (body.vehicleId !== undefined) updateData.vehicleId = body.vehicleId;
      if (body.driverId !== undefined) updateData.driverId = body.driverId;
      if (body.cargoWeight !== undefined) updateData.cargoWeight = parseFloat(body.cargoWeight);
      if (body.plannedDistance !== undefined) updateData.plannedDistance = parseFloat(body.plannedDistance);
      if (body.estimatedDuration !== undefined) updateData.estimatedDuration = parseInt(body.estimatedDuration, 10);
      if (body.tripRevenue !== undefined) updateData.tripRevenue = new PrismaDecimalWrapper(body.tripRevenue);
      if (body.remarks !== undefined) updateData.remarks = body.remarks || null;

      const trip = await this.tripService.updateTrip(id, updateData, userId, ipAddress, userAgent);
      sendSuccess(res, trip, 'Trip details updated successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── PATCH /api/trips/:id/dispatch ────────────────────────────────────────
  dispatchTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const trip = await this.tripService.dispatchTrip(id, userId, ipAddress, userAgent);
      sendSuccess(res, trip, 'Trip dispatched successfully. Vehicles/Drivers locked to trip.');
    } catch (error) {
      next(error);
    }
  };

  // ─── PATCH /api/trips/:id/complete ────────────────────────────────────────
  completeTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { endOdometer, actualDistance } = req.body;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const trip = await this.tripService.completeTrip(
        id,
        parseFloat(endOdometer),
        parseFloat(actualDistance),
        userId,
        ipAddress,
        userAgent
      );
      sendSuccess(res, trip, 'Trip completed successfully. Vehicle and Driver released.');
    } catch (error) {
      next(error);
    }
  };

  // ─── PATCH /api/trips/:id/cancel ──────────────────────────────────────────
  cancelTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.sub;
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const trip = await this.tripService.cancelTrip(id, userId, ipAddress, userAgent);
      sendSuccess(res, trip, 'Trip cancelled successfully.');
    } catch (error) {
      next(error);
    }
  };
}

// Decimal value mapping helper for Prisma decimal compatibility
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
