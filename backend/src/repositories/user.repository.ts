import { User } from '@prisma/client';
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
}
