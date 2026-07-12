import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../utils/app-error.util';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

// ─── RBAC Role Guard ──────────────────────────────────────────────────────────
// Factory middleware. Returns a handler that checks whether the authenticated
// user's role is in the allowed roles list.
//
// Usage:
//   router.get('/admin', authenticate, requireRole(UserRole.SUPER_ADMIN), handler)
//   router.get('/fleet', authenticate, requireRole([UserRole.SUPER_ADMIN, UserRole.FLEET_MANAGER]), handler)

export function requireRole(
  allowedRoles: UserRole | UserRole[]
): RequestHandler {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return next(
        new AppError(
          'Authentication required',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.TOKEN_MISSING
        )
      );
    }

    if (!roles.includes(authReq.user.role)) {
      return next(
        new AppError(
          `Access denied. Required roles: ${roles.join(', ')}`,
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.INSUFFICIENT_ROLE
        )
      );
    }

    next();
  };
}
