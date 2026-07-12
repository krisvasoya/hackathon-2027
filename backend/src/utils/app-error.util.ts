import { HTTP_STATUS, ERROR_CODES } from '../constants';

// ─── Application Error ────────────────────────────────────────────────────────
// All intentional errors thrown by services must be AppError instances.
// The global error handler distinguishes AppErrors from unexpected exceptions.

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Typed Error Factories ────────────────────────────────────────────────────

export const createUnauthorizedError = (message = 'Authentication required') =>
  new AppError(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_MISSING);

export const createForbiddenError = (message = 'Insufficient permissions') =>
  new AppError(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);

export const createNotFoundError = (resource: string) =>
  new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);

export const createConflictError = (message: string) =>
  new AppError(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);

export const createValidationError = (message: string) =>
  new AppError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR);
