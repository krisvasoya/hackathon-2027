import { User, UserRole, UserStatus } from '@prisma/client';

// ─── Repository Interfaces ────────────────────────────────────────────────────

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmployeeId(employeeId: string): Promise<User | null>;
  updateLastLogin(id: string): Promise<void>;
  updateRefreshToken(id: string, tokenHash: string | null): Promise<void>;
  incrementFailedLogin(id: string): Promise<void>;
  resetFailedLogin(id: string): Promise<void>;
  lockAccount(id: string, until: Date): Promise<void>;
}

// ─── Service Interfaces ───────────────────────────────────────────────────────

export interface IAuthService {
  login(email: string, password: string, ipAddress: string, userAgent: string): Promise<AuthTokens>;
  logout(userId: string): Promise<void>;
  refreshAccessToken(refreshToken: string): Promise<Pick<AuthTokens, 'accessToken'>>;
  verifyAccessToken(token: string): Promise<import('../types').JwtAccessPayload>;
}

// ─── Data Transfer Objects ────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export interface PublicUser {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  department: string | null;
  phone: string | null;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
}

// ─── Audit Interface ──────────────────────────────────────────────────────────

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}
