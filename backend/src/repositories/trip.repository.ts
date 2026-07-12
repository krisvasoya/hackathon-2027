import { Trip, TripStatus, Prisma } from '@prisma/client';
import { prisma } from '../database/client';

export interface GetTripsParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: TripStatus;
  vehicleId?: string;
  driverId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class TripRepository {
  // ─── Build Query Filter ───────────────────────────────────────────────────
  private buildWhereClause(params: Omit<GetTripsParams, 'page' | 'limit'>): Prisma.TripWhereInput {
    const where: Prisma.TripWhereInput = {};

    // Search by tripNumber, vehicleName, or driver fullName (Case-insensitive)
    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { tripNumber: { contains: term, mode: 'insensitive' } },
        { vehicle: { vehicleName: { contains: term, mode: 'insensitive' } } },
        { driver: { fullName: { contains: term, mode: 'insensitive' } } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.vehicleId) {
      where.vehicleId = params.vehicleId;
    }

    if (params.driverId) {
      where.driverId = params.driverId;
    }

    // Date Range Filtering on tripStartTime
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    return where;
  }

  // ─── List Trips (Paginated, Sorted, Filtered) ──────────────────────────────
  async findMany(params: GetTripsParams): Promise<any[]> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', ...filterParams } = params;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filterParams);

    const allowedSortFields = [
      'tripNumber',
      'cargoWeight',
      'plannedDistance',
      'tripStartTime',
      'tripEndTime',
      'tripRevenue',
      'status',
      'createdAt',
    ];

    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    return prisma.trip.findMany({
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
            vehicleModel: true,
            vehicleType: true,
            maximumLoadCapacity: true,
          },
        },
        driver: {
          select: {
            id: true,
            fullName: true,
            employeeId: true,
            licenseNumber: true,
            licenseCategory: true,
            licenseExpiryDate: true,
            phoneNumber: true,
            safetyScore: true,
            status: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // ─── Count Total Matching Trips ────────────────────────────────────────────
  async count(params: Omit<GetTripsParams, 'page' | 'limit'>): Promise<number> {
    const where = this.buildWhereClause(params);
    return prisma.trip.count({ where });
  }

  // ─── Find By ID ────────────────────────────────────────────────────────────
  async findById(id: string): Promise<any | null> {
    return prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // ─── Find By Trip Number ───────────────────────────────────────────────────
  async findByTripNumber(tripNumber: string): Promise<Trip | null> {
    return prisma.trip.findUnique({
      where: { tripNumber: tripNumber.toUpperCase().trim() },
    });
  }

  // ─── Create Trip ───────────────────────────────────────────────────────────
  async create(data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    return prisma.trip.create({
      data: {
        ...data,
        tripNumber: data.tripNumber.toUpperCase().trim(),
      },
    });
  }

  // ─── Update Trip ───────────────────────────────────────────────────────────
  async update(id: string, data: Partial<Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Trip> {
    return prisma.trip.update({
      where: { id },
      data,
    });
  }

  // ─── Update Trip, Vehicle, and Driver in Transaction ────────────────────────
  // Crucial for automatic status changes to maintain transactional boundary
  async executeDispatchTransaction(
    tripId: string,
    vehicleId: string,
    driverId: string,
    startOdometer: number
  ): Promise<Trip> {
    return prisma.$transaction(async (tx) => {
      // 1. Update vehicle status -> ON_TRIP
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'ON_TRIP' },
      });

      // 2. Update driver status -> ON_TRIP
      await tx.driver.update({
        where: { id: driverId },
        data: { status: 'ON_TRIP' },
      });

      // 3. Update trip -> DISPATCHED, add startTime and startOdometer
      return tx.trip.update({
        where: { id: tripId },
        data: {
          status: 'DISPATCHED',
          tripStartTime: new Date(),
          startOdometer,
        },
      });
    });
  }

  // ─── Execute Trip Completion in Transaction ─────────────────────────────────
  async executeCompleteTransaction(params: {
    tripId: string;
    vehicleId: string;
    driverId: string;
    endOdometer: number;
    actualDistance: number;
  }): Promise<Trip> {
    return prisma.$transaction(async (tx) => {
      // 1. Update vehicle status -> AVAILABLE and increment odometer
      await tx.vehicle.update({
        where: { id: params.vehicleId },
        data: {
          status: 'AVAILABLE',
          currentOdometer: params.endOdometer,
        },
      });

      // 2. Update driver status -> AVAILABLE
      await tx.driver.update({
        where: { id: params.driverId },
        data: { status: 'AVAILABLE' },
      });

      // 3. Update trip -> COMPLETED, add endTime, endOdometer, actualDistance
      return tx.trip.update({
        where: { id: params.tripId },
        data: {
          status: 'COMPLETED',
          tripEndTime: new Date(),
          endOdometer: params.endOdometer,
          actualDistance: params.actualDistance,
        },
      });
    });
  }

  // ─── Execute Trip Cancellation in Transaction ────────────────────────────────
  async executeCancelTransaction(
    tripId: string,
    vehicleId: string,
    driverId: string
  ): Promise<Trip> {
    return prisma.$transaction(async (tx) => {
      // 1. Reset vehicle status to AVAILABLE
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'AVAILABLE' },
      });

      // 2. Reset driver status to AVAILABLE
      await tx.driver.update({
        where: { id: driverId },
        data: { status: 'AVAILABLE' },
      });

      // 3. Update trip -> CANCELLED
      return tx.trip.update({
        where: { id: tripId },
        data: { status: 'CANCELLED' },
      });
    });
  }
}
