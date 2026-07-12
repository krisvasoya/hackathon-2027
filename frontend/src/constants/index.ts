import type { UserRole } from '../types';

// ─── Application ──────────────────────────────────────────────────────────────

export const APP_NAME = 'TransitOps';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '1.0.0';

// ─── Local Storage Keys ───────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'transitops_access_token',
  USER: 'transitops_user',
} as const;

// ─── Routes ───────────────────────────────────────────────────────────────────

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  VEHICLES: '/vehicles',
  DRIVERS: '/drivers',
  TRIPS: '/trips',
  TRIP_DETAILS: '/trips/:id',
  MAINTENANCE: '/maintenance',
  FUEL: '/fuel',
  REPORTS: '/reports',
  USERS: '/admin/users',
  SETTINGS: '/settings',
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/404',
} as const;

// ─── RBAC Role Labels ─────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  FLEET_MANAGER: 'Fleet Manager',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
  DISPATCHER: 'Dispatcher',
  DRIVER: 'Driver',
  VIEWER: 'Viewer',
};

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
} as const;

// ─── Query Keys (TanStack Query) ──────────────────────────────────────────────

export const QUERY_KEYS = {
  AUTH_ME: ['auth', 'me'],
  USERS: ['users'],
  VEHICLES: ['vehicles'],
  DRIVERS: ['drivers'],
  TRIPS: ['trips'],
  MAINTENANCE: ['maintenance'],
  FUEL: ['fuel'],
} as const;
