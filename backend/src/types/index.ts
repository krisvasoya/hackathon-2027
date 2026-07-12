import { UserRole, UserStatus } from '@prisma/client';
import { Request } from 'express';

// ─── Re-export Prisma Enums ───────────────────────────────────────────────────

export { UserRole, UserStatus };

// ─── Authenticated User Payload (JWT) ─────────────────────────────────────────

export interface JwtAccessPayload {
  sub: string;          // User CUID
  email: string;
  role: UserRole;
  employeeId: string;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string;
  tokenFamily?: string; // For refresh token rotation
  iat?: number;
  exp?: number;
}

// ─── Authenticated Request ────────────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user: JwtAccessPayload;
}

// ─── API Response Envelope ────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: FieldError[];
  timestamp: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ─── Service Results ──────────────────────────────────────────────────────────

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
