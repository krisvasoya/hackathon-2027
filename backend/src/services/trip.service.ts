import { Trip, TripStatus, VehicleStatus, DriverStatus } from '@prisma/client';
import { TripRepository, GetTripsParams } from '../repositories/trip.repository';
import { prisma } from '../database/client';
import { AppError } from '../utils/app-error.util';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { logger } from '../config/logger';
import { writeAuditLog } from '../utils/audit.util';
import { PaginatedResult } from '../types';

export class TripService {
  private readonly tripRepository: TripRepository;

  constructor() {
    this.tripRepository = new TripRepository();
  }

  // ─── Generate Unique Trip Number ──────────────────────────────────────────
  private async generateTripNumber(): Promise<string> {
    const today = new Date();
    const yyyy = today.getFullYear().toString();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    // Get total count of trips created today to make a sequential suffix
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const todayTripsCount = await prisma.trip.count({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const sequence = String(todayTripsCount + 1).padStart(4, '0');
    return `TRP-${dateStr}-${sequence}`;
  }

  // ─── Get All Trips (Paginated, Sorted, Filtered) ───────────────────────────
  async getTrips(params: GetTripsParams): Promise<PaginatedResult<any>> {
    const data = await this.tripRepository.findMany(params);
    const total = await this.tripRepository.count(params);

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

  // ─── Get Trip By ID ────────────────────────────────────────────────────────
  async getTripById(id: string): Promise<any> {
    const trip = await this.tripRepository.findById(id);
    if (!trip) {
      throw new AppError('Trip not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return trip;
  }

  // ─── Create Trip (Draft) ───────────────────────────────────────────────────
  async createTrip(
    data: Omit<Trip, 'id' | 'tripNumber' | 'status' | 'tripStartTime' | 'tripEndTime' | 'startOdometer' | 'endOdometer' | 'actualDistance' | 'createdAt' | 'updatedAt'>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Trip> {
    // 1. Fetch Vehicle and Driver to validate existence and properties
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) {
      throw new AppError('Selected vehicle does not exist', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
    if (!driver) {
      throw new AppError('Selected driver does not exist', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    // 2. Business Rule: Cargo Weight must not exceed vehicle capacity
    if (data.cargoWeight > vehicle.maximumLoadCapacity) {
      throw new AppError(
        `Business Rule Violation: Cargo weight (${data.cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maximumLoadCapacity} kg).`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 3. Business Rule: Driver license expiry cannot be in the past
    if (new Date(driver.licenseExpiryDate) < new Date()) {
      throw new AppError(
        'Business Rule Violation: Selected driver license is expired.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Generate Unique sequential Trip Number
    const tripNumber = await this.generateTripNumber();

    const trip = await this.tripRepository.create({
      ...data,
      tripNumber,
      status: TripStatus.DRAFT,
      tripStartTime: null,
      tripEndTime: null,
      startOdometer: null,
      endOdometer: null,
      actualDistance: null,
      createdBy: userId,
    });

    logger.info('Trip Created', { tripId: trip.id, tripNumber: trip.tripNumber, createdBy: userId });

    await writeAuditLog({
      userId,
      action: 'TRIP_CREATE',
      resource: 'trips',
      resourceId: trip.id,
      ipAddress,
      userAgent,
      metadata: { tripNumber: trip.tripNumber, vehicleId: trip.vehicleId, driverId: trip.driverId },
    });

    return trip;
  }

  // ─── Update Trip (Only allowed in DRAFT status) ────────────────────────────
  async updateTrip(
    id: string,
    data: Partial<Omit<Trip, 'id' | 'tripNumber' | 'status' | 'createdBy' | 'createdAt' | 'updatedAt'>>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Trip> {
    const trip = await this.getTripById(id);

    // Only allow updates in DRAFT mode
    if (trip.status !== TripStatus.DRAFT) {
      throw new AppError(
        'Business Rule Violation: Only trips in DRAFT state can be edited.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Validate relationships if modified
    const targetVehicleId = data.vehicleId ?? trip.vehicleId;
    const targetDriverId = data.driverId ?? trip.driverId;
    const targetCargo = data.cargoWeight ?? trip.cargoWeight;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: targetVehicleId } });
    const driver = await prisma.driver.findUnique({ where: { id: targetDriverId } });

    if (!vehicle || !driver) {
      throw new AppError('Selected vehicle or driver not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (targetCargo > vehicle.maximumLoadCapacity) {
      throw new AppError(
        `Business Rule Violation: Cargo weight (${targetCargo} kg) exceeds vehicle maximum capacity (${vehicle.maximumLoadCapacity} kg).`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (new Date(driver.licenseExpiryDate) < new Date()) {
      throw new AppError(
        'Business Rule Violation: Selected driver license is expired.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const updatedTrip = await this.tripRepository.update(id, data);

    logger.info('Trip Updated', { tripId: id, updatedBy: userId });

    await writeAuditLog({
      userId,
      action: 'TRIP_UPDATE',
      resource: 'trips',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { changes: data },
    });

    return updatedTrip;
  }

  // ─── Dispatch Trip (DRAFT -> DISPATCHED) ───────────────────────────────────
  async dispatchTrip(
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Trip> {
    const trip = await this.getTripById(id);

    if (trip.status !== TripStatus.DRAFT) {
      throw new AppError(
        'Only trips in DRAFT status can be dispatched.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
    const driver = await prisma.driver.findUnique({ where: { id: trip.driverId } });

    if (!vehicle || !driver) {
      throw new AppError('Vehicle or Driver associated with trip not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    // ─── Enforce Dispatch Verification Rules ───
    // 1. Vehicle availability checks
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new AppError(
        `Business Rule Violation: Vehicle is not AVAILABLE (Current status: ${vehicle.status}).`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 2. Driver availability checks
    if (driver.status !== DriverStatus.AVAILABLE) {
      throw new AppError(
        `Business Rule Violation: Driver is not AVAILABLE (Current status: ${driver.status}).`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Check for any active overlapping dispatched trips for this driver
    const overlappingActiveTrip = await prisma.trip.findFirst({
      where: {
        driverId: trip.driverId,
        status: TripStatus.DISPATCHED,
        id: { not: trip.id },
      },
    });

    if (overlappingActiveTrip) {
      throw new AppError(
        `Business Rule Violation: Driver is already assigned to active dispatched trip (${overlappingActiveTrip.tripNumber}).`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 3. License expiry validation
    if (new Date(driver.licenseExpiryDate) < new Date()) {
      throw new AppError(
        'Business Rule Violation: Driver license is expired. Cannot dispatch.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Execute atomic transaction: Update Vehicle/Driver to ON_TRIP, Update Trip to DISPATCHED
    const startOdometer = vehicle.currentOdometer;
    const dispatchedTrip = await this.tripRepository.executeDispatchTransaction(
      id,
      trip.vehicleId,
      trip.driverId,
      startOdometer
    );

    logger.info('Trip Dispatched', { tripId: id, tripNumber: trip.tripNumber, dispatchedBy: userId });

    await writeAuditLog({
      userId,
      action: 'TRIP_DISPATCH',
      resource: 'trips',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { tripNumber: trip.tripNumber, startOdometer },
    });

    return dispatchedTrip;
  }

  // ─── Complete Trip (DISPATCHED -> COMPLETED) ───────────────────────────────
  async completeTrip(
    id: string,
    endOdometer: number,
    actualDistance: number,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Trip> {
    const trip = await this.getTripById(id);

    if (trip.status !== TripStatus.DISPATCHED) {
      throw new AppError(
        'Only trips in DISPATCHED status can be marked as COMPLETED.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const startOdometer = trip.startOdometer || 0;
    if (endOdometer < startOdometer) {
      throw new AppError(
        `Business Rule Violation: End odometer (${endOdometer} km) cannot be less than start odometer (${startOdometer} km).`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (actualDistance <= 0) {
      throw new AppError(
        'Business Rule Violation: Actual distance must be greater than zero.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Execute atomic transaction: Update Vehicle/Driver to AVAILABLE, update vehicle odometer, set Trip status COMPLETED
    const completedTrip = await this.tripRepository.executeCompleteTransaction({
      tripId: id,
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      endOdometer,
      actualDistance,
    });

    logger.info('Trip Completed', { tripId: id, tripNumber: trip.tripNumber, completedBy: userId });

    await writeAuditLog({
      userId,
      action: 'TRIP_COMPLETE',
      resource: 'trips',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { tripNumber: trip.tripNumber, startOdometer, endOdometer, actualDistance },
    });

    return completedTrip;
  }

  // ─── Cancel Trip (DRAFT/DISPATCHED -> CANCELLED) ───────────────────────────
  async cancelTrip(
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Trip> {
    const trip = await this.getTripById(id);

    if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
      throw new AppError(
        `Trips already ${trip.status} cannot be cancelled.`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    let cancelledTrip: Trip;

    // If trip was dispatched, we need to release the vehicle and driver back to AVAILABLE
    if (trip.status === TripStatus.DISPATCHED) {
      cancelledTrip = await this.tripRepository.executeCancelTransaction(
        id,
        trip.vehicleId,
        trip.driverId
      );
    } else {
      // Just update status to CANCELLED directly
      cancelledTrip = await this.tripRepository.update(id, { status: TripStatus.CANCELLED });
    }

    logger.info('Trip Cancelled', { tripId: id, tripNumber: trip.tripNumber, cancelledBy: userId });

    await writeAuditLog({
      userId,
      action: 'TRIP_CANCEL',
      resource: 'trips',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { tripNumber: trip.tripNumber },
    });

    return cancelledTrip;
  }
}
