import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.util';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

// ─── Validation Result Handler ────────────────────────────────────────────────
// Placed AFTER express-validator chain rules on a route.
// Collects all validation errors and returns them in the standard envelope.

export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const fieldErrors = errors.array().map((err) => ({
      field: err.type === 'field' ? (err as { path: string }).path : 'unknown',
      message: err.msg,
    }));

    sendError(
      res,
      'Validation failed. Please check the provided data.',
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      fieldErrors
    );
    return;
  }

  next();
}
