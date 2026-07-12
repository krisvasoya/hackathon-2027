import { User, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../database/client';
import { IUserRepository } from '../interfaces';
import { logger } from '../config/logger';

// ─── User Repository ──────────────────────────────────────────────────────────
// The ONLY layer allowed to touch the database for User operations.
// No business logic. Only database queries.

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findByEmployeeId(employeeId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { employeeId } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date(), failedLoginCount: 0, lockedUntil: null },
    });
  }

  async updateRefreshToken(id: string, tokenHash: string | null): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { refreshTokenHash: tokenHash },
    });
  }

  async incrementFailedLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { failedLoginCount: { increment: 1 } },
    });
  }

  async resetFailedLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lockedUntil: until },
    });
    logger.warn('User account locked', { userId: id, lockedUntil: until });
  }

  private buildWhereClause(params: { search?: string; role?: UserRole; status?: UserStatus }) {
    const where: any = {};
    if (params.search) {
      const searchLower = params.search.trim();
      where.OR = [
        { firstName: { contains: searchLower, mode: 'insensitive' } },
        { lastName: { contains: searchLower, mode: 'insensitive' } },
        { email: { contains: searchLower, mode: 'insensitive' } },
        { employeeId: { contains: searchLower, mode: 'insensitive' } },
      ];
    }
    if (params.role) {
      where.role = params.role;
    }
    if (params.status) {
      where.status = params.status;
    }
    return where;
  }

  async findMany(params: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    role?: UserRole;
    status?: UserStatus;
  }): Promise<User[]> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', search, role, status } = params;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause({ search, role, status });

    return prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });
  }

  async count(params: { search?: string; role?: UserRole; status?: UserStatus }): Promise<number> {
    const where = this.buildWhereClause(params);
    return prisma.user.count({ where });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
}
