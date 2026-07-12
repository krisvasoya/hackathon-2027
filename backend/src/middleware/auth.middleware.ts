import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { AuthenticatedRequest, JwtAccessPayload } from '../types';
import { AppError } from '../utils/app-error.util';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

// ─── JWT Authentication Middleware ────────────────────────────────────────────
// Validates the Bearer token from the Authorization header.
// Attaches the decoded payload to req.user.

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError(
        'Authorization token is required',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.TOKEN_MISSING
      )
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, jwtConfig.access.secret) as JwtAccessPayload;
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(
        new AppError(
          'Access token has expired',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.TOKEN_EXPIRED
        )
      );
    }

    return next(
      new AppError(
        'Invalid access token',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.TOKEN_INVALID
      )
    );
  }
}
