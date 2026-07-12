import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { sendSuccess } from '../utils/response.util';
import { PAGINATION } from '../constants';
import { UserRole, UserStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

export class UserController {
  private readonly userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit as string, 10) || PAGINATION.DEFAULT_LIMIT;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      const search = req.query.search as string;
      const role = req.query.role as UserRole;
      const status = req.query.status as UserStatus;

      const result = await this.userService.getUsers({
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        role,
        status,
      });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const operatorId = authReq.user!.id;
      const ipAddress = req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const updated = await this.userService.updateUser(
        id,
        req.body,
        operatorId,
        ipAddress,
        userAgent
      );

      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  };

  updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const authReq = req as AuthenticatedRequest;
      const operatorId = authReq.user!.id;
      const ipAddress = req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const updated = await this.userService.updateUser(
        id,
        { status },
        operatorId,
        ipAddress,
        userAgent
      );

      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const operatorId = authReq.user!.id;
      const ipAddress = req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';

      await this.userService.resetPassword(id, operatorId, ipAddress, userAgent);
      sendSuccess(res, null, 'Password reset process initiated.');
    } catch (error) {
      next(error);
    }
  };
}
