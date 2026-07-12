import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error.util';
import { sendError } from '../utils/response.util';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

// ─── Global Error Handler ─────────────────────────────────────────────────────
// This MUST be the last middleware registered in app.ts (4 arguments).

export function globalErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Operational errors: expected business errors thrown by services
  if (error instanceof AppError && error.isOperational) {
    logger.warn('Operational error', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      path: req.path,
      method: req.method,
    });

    sendError(res, error.message, error.code, error.statusCode);
    return;
  }

  // Programming errors: unexpected failures (bugs, DB issues, etc.)
  logger.error('Unhandled error', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Never expose internal error details in production
  const message = env.app.isDevelopment
    ? error.message
    : 'An unexpected error occurred. Please try again later.';

  sendError(
    res,
    message,
    ERROR_CODES.INTERNAL_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}

// ─── 404 Handler ─────────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(
    new AppError(
      `Route ${req.method} ${req.path} not found`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND
    )
  );
}
