import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';
import { sendSuccess } from '../utils/response.util';
import { PAGINATION } from '../constants';

export class AuditController {
  getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit as string, 10) || PAGINATION.DEFAULT_LIMIT;
      const search = req.query.search as string;
      const action = req.query.action as string;
      const resource = req.query.resource as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const skip = (page - 1) * limit;

      const where: any = {};

      if (search) {
        where.OR = [
          { action: { contains: search, mode: 'insensitive' } },
          { resource: { contains: search, mode: 'insensitive' } },
          { resourceId: { contains: search, mode: 'insensitive' } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (action) {
        where.action = action;
      }

      if (resource) {
        where.resource = resource;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      sendSuccess(
        res,
        {
          data: logs,
          pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
        'Audit logs retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };
}
