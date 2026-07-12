import { User, UserRole, UserStatus } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../utils/app-error.util';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { writeAuditLog } from '../utils/audit.util';
import { PaginatedResult } from '../types';

export class UserService {
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getUsers(params: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    role?: UserRole;
    status?: UserStatus;
  }): Promise<PaginatedResult<User>> {
    const data = await this.userRepository.findMany(params);
    const total = await this.userRepository.count(params);
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

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return user;
  }

  async updateUser(
    id: string,
    input: Partial<User>,
    operatorId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const updated = await this.userRepository.update(id, input);

    writeAuditLog({
      userId: operatorId,
      action: 'USER_UPDATE',
      resource: 'User',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: {
        fieldsChanged: Object.keys(input),
      },
    });

    return updated;
  }

  async resetPassword(
    id: string,
    operatorId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    writeAuditLog({
      userId: operatorId,
      action: 'USER_PASSWORD_RESET',
      resource: 'User',
      resourceId: id,
      ipAddress,
      userAgent,
    });
  }
}
