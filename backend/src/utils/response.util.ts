import { Response } from 'express';
import { HTTP_STATUS } from '../constants';
import { ApiSuccessResponse, ApiErrorResponse, FieldError } from '../types';

// ─── Success Response ─────────────────────────────────────────────────────────

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode: number = HTTP_STATUS.OK
): Response {
  const response: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message = 'Resource created successfully'
): Response {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
}

export function sendNoContent(res: Response): Response {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
}

// ─── Error Response ───────────────────────────────────────────────────────────

export function sendError(
  res: Response,
  message: string,
  code: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors?: FieldError[]
): Response {
  const response: ApiErrorResponse = {
    success: false,
    message,
    code,
    ...(errors && errors.length > 0 ? { errors } : {}),
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
}
