// ─── HTTP Status Codes ────────────────────────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ─── Error Codes ──────────────────────────────────────────────────────────────

export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'AUTH_001',
  ACCOUNT_LOCKED: 'AUTH_002',
  ACCOUNT_INACTIVE: 'AUTH_003',
  TOKEN_EXPIRED: 'AUTH_004',
  TOKEN_INVALID: 'AUTH_005',
  TOKEN_MISSING: 'AUTH_006',
  REFRESH_TOKEN_INVALID: 'AUTH_007',
  // Authorization
  FORBIDDEN: 'AUTHZ_001',
  INSUFFICIENT_ROLE: 'AUTHZ_002',
  // Validation
  VALIDATION_ERROR: 'VAL_001',
  // Resource
  NOT_FOUND: 'RES_001',
  CONFLICT: 'RES_002',
  // Server
  INTERNAL_ERROR: 'SRV_001',
  DATABASE_ERROR: 'SRV_002',
  // Rate Limit
  RATE_LIMIT_EXCEEDED: 'RL_001',
} as const;

// ─── Account Security ────────────────────────────────────────────────────────

export const SECURITY = {
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
} as const;

// ─── Pagination Defaults ──────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
