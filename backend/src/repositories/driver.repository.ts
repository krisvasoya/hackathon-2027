import { Driver, DriverStatus, Prisma } from '@prisma/client';
import { prisma } from '../database/client';

export interface GetDriversParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: DriverStatus;
  licenseCategory?: string;
  minSafetyScore?: number;
  maxSafetyScore?: number;
  licenseExpiryBefore?: Date;
}

export class DriverRepository {
  // ─── Build Query Filter ───────────────────────────────────────────────────
  private buildWhereClause(params: Omit<GetDriversParams, 'page' | 'limit'>): Prisma.DriverWhereInput {
    const where: Prisma.DriverWhereInput = {};

    // Search by Name, License Number, and Phone Number (Case-insensitive)
    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { licenseNumber: { contains: term, mode: 'insensitive' } },
        { phoneNumber: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.licenseCategory) {
      where.licenseCategory = { equals: params.licenseCategory, mode: 'insensitive' };
    }

    // Safety Score filtering
    if (params.minSafetyScore !== undefined || params.maxSafetyScore !== undefined) {
      where.safetyScore = {};
      if (params.minSafetyScore !== undefined) {
        where.safetyScore.gte = params.minSafetyScore;
      }
      if (params.maxSafetyScore !== undefined) {
        where.safetyScore.lte = params.maxSafetyScore;
      }
    }

    // License Expiry before a certain date
    if (params.licenseExpiryBefore) {
      where.licenseExpiryDate = {
        lt: params.licenseExpiryBefore,
      };
    }

    return where;
  }

  // ─── List Drivers (Paginated, Sorted, Filtered) ────────────────────────────
  async findMany(params: GetDriversParams): Promise<Driver[]> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', ...filterParams } = params;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filterParams);

    const allowedSortFields = [
      'fullName',
      'employeeId',
      'licenseNumber',
      'licenseExpiryDate',
      'safetyScore',
      'yearsOfExperience',
      'status',
      'createdAt',
    ];

    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    return prisma.driver.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [actualSortBy]: sortOrder,
      },
    });
  }

  // ─── Count Total Matching Drivers ──────────────────────────────────────────
  async count(params: Omit<GetDriversParams, 'page' | 'limit'>): Promise<number> {
    const where = this.buildWhereClause(params);
    return prisma.driver.count({ where });
  }

  // ─── Find By ID ────────────────────────────────────────────────────────────
  async findById(id: string): Promise<Driver | null> {
    return prisma.driver.findUnique({
      where: { id },
    });
  }

  // ─── Find By License Number ────────────────────────────────────────────────
  async findByLicenseNumber(licenseNumber: string): Promise<Driver | null> {
    return prisma.driver.findUnique({
      where: { licenseNumber: licenseNumber.toUpperCase().trim() },
    });
  }

  // ─── Find By Employee ID ───────────────────────────────────────────────────
  async findByEmployeeId(employeeId: string): Promise<Driver | null> {
    return prisma.driver.findUnique({
      where: { employeeId: employeeId.trim() },
    });
  }

  // ─── Create Driver ─────────────────────────────────────────────────────────
  async create(data: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): Promise<Driver> {
    return prisma.driver.create({
      data: {
        ...data,
        licenseNumber: data.licenseNumber.toUpperCase().trim(),
        employeeId: data.employeeId ? data.employeeId.trim() : null,
      },
    });
  }

  // ─── Update Driver ─────────────────────────────────────────────────────────
  async update(id: string, data: Partial<Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Driver> {
    const updateData = { ...data };
    if (updateData.licenseNumber) {
      updateData.licenseNumber = updateData.licenseNumber.toUpperCase().trim();
    }
    if (updateData.employeeId) {
      updateData.employeeId = updateData.employeeId.trim();
    }
    return prisma.driver.update({
      where: { id },
      data: updateData,
    });
  }

  // ─── Delete Driver ─────────────────────────────────────────────────────────
  async delete(id: string): Promise<Driver> {
    return prisma.driver.delete({
      where: { id },
    });
  }
}
