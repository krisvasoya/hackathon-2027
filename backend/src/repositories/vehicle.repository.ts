import { Vehicle, VehicleStatus, Prisma } from '@prisma/client';
import { prisma } from '../database/client';

export interface GetVehiclesParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: VehicleStatus;
  type?: string;
  region?: string;
}

export class VehicleRepository {
  // ─── Build Query Filter ───────────────────────────────────────────────────
  private buildWhereClause(params: Omit<GetVehiclesParams, 'page' | 'limit'>): Prisma.VehicleWhereInput {
    const where: Prisma.VehicleWhereInput = {};

    // Search on registrationNumber, vehicleName, vehicleModel (Case-insensitive)
    if (params.search) {
      const searchLower = params.search.trim();
      where.OR = [
        { registrationNumber: { contains: searchLower, mode: 'insensitive' } },
        { vehicleName: { contains: searchLower, mode: 'insensitive' } },
        { vehicleModel: { contains: searchLower, mode: 'insensitive' } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.type) {
      where.vehicleType = { equals: params.type, mode: 'insensitive' };
    }

    if (params.region) {
      where.region = { equals: params.region, mode: 'insensitive' };
    }

    return where;
  }

  // ─── List Vehicles (Paginated, Sorted, Filtered) ───────────────────────────
  async findMany(params: GetVehiclesParams): Promise<Vehicle[]> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', ...filterParams } = params;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filterParams);

    const allowedSortFields = [
      'registrationNumber',
      'vehicleName',
      'vehicleModel',
      'vehicleType',
      'region',
      'maximumLoadCapacity',
      'status',
      'insuranceExpiry',
      'registrationExpiry',
      'createdAt',
    ];

    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    return prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [actualSortBy]: sortOrder,
      },
    });
  }

  // ─── Count Total Matching Vehicles ─────────────────────────────────────────
  async count(params: Omit<GetVehiclesParams, 'page' | 'limit'>): Promise<number> {
    const where = this.buildWhereClause(params);
    return prisma.vehicle.count({ where });
  }

  // ─── Find By ID ────────────────────────────────────────────────────────────
  async findById(id: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({
      where: { id },
    });
  }

  // ─── Find By Registration Number ───────────────────────────────────────────
  async findByRegistrationNumber(registrationNumber: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({
      where: { registrationNumber: registrationNumber.toUpperCase().trim() },
    });
  }

  // ─── Create Vehicle ────────────────────────────────────────────────────────
  async create(data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    return prisma.vehicle.create({
      data: {
        ...data,
        registrationNumber: data.registrationNumber.toUpperCase().trim(),
      },
    });
  }

  // ─── Update Vehicle ────────────────────────────────────────────────────────
  async update(id: string, data: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Vehicle> {
    const updateData = { ...data };
    if (updateData.registrationNumber) {
      updateData.registrationNumber = updateData.registrationNumber.toUpperCase().trim();
    }
    return prisma.vehicle.update({
      where: { id },
      data: updateData,
    });
  }

  // ─── Delete Vehicle ────────────────────────────────────────────────────────
  async delete(id: string): Promise<Vehicle> {
    return prisma.vehicle.delete({
      where: { id },
    });
  }
}
