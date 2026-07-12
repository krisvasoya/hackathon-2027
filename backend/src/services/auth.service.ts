import jwt from 'jsonwebtoken';
import { UserStatus } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { jwtConfig } from '../config/jwt';
import { IAuthService, AuthTokens, PublicUser } from '../interfaces';
import { JwtAccessPayload, JwtRefreshPayload } from '../types';
import { comparePassword, hashToken, compareToken } from '../utils/hash.util';
import { writeAuditLog } from '../utils/audit.util';
import { AppError } from '../utils/app-error.util';
import { HTTP_STATUS, ERROR_CODES, SECURITY } from '../constants';
import { logger } from '../config/logger';

// ─── Auth Service ─────────────────────────────────────────────────────────────
// Owns all authentication business rules.
// Never touches the database directly — delegates to UserRepository.

export class AuthService implements IAuthService {
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmail(email);

    // Generic error message to prevent user enumeration
    const invalidCredentialsError = new AppError(
      'Invalid email or password',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_CREDENTIALS
    );

    if (!user) {
      logger.warn('Login attempt for non-existent email', { email, ipAddress });
      throw invalidCredentialsError;
    }

    // Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      throw new AppError(
        `Account is locked. Try again in ${minutesLeft} minute(s).`,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.ACCOUNT_LOCKED
      );
    }

    // Check account status
    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(
        'Your account is not active. Please contact your administrator.',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.ACCOUNT_INACTIVE
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      await this.userRepository.incrementFailedLogin(user.id);

      const newFailedCount = user.failedLoginCount + 1;

      if (newFailedCount >= SECURITY.MAX_FAILED_LOGIN_ATTEMPTS) {
        const lockUntil = new Date(
          Date.now() + SECURITY.LOCKOUT_DURATION_MINUTES * 60 * 1000
        );
        await this.userRepository.lockAccount(user.id, lockUntil);

        await writeAuditLog({
          userId: user.id,
          action: 'ACCOUNT_LOCKED',
          resource: 'users',
          resourceId: user.id,
          ipAddress,
          userAgent,
        });
      }

      throw invalidCredentialsError;
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user.id);
    const refreshTokenHash = await hashToken(refreshToken);

    // Persist refresh token hash & update login metadata
    await this.userRepository.updateRefreshToken(user.id, refreshTokenHash);
    await this.userRepository.updateLastLogin(user.id);

    await writeAuditLog({
      userId: user.id,
      action: 'LOGIN',
      resource: 'auth',
      ipAddress,
      userAgent,
    });

    logger.info('User logged in', { userId: user.id, role: user.role });

    return {
      accessToken,
      refreshToken,
      user: this.toPublicUser(user),
    };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(userId: string): Promise<void> {
    await this.userRepository.updateRefreshToken(userId, null);
    logger.info('User logged out', { userId });
  }

  // ─── Refresh Access Token ─────────────────────────────────────────────────

  async refreshAccessToken(
    refreshToken: string
  ): Promise<Pick<AuthTokens, 'accessToken'>> {
    let payload: JwtRefreshPayload;

    try {
      payload = jwt.verify(
        refreshToken,
        jwtConfig.refresh.secret
      ) as JwtRefreshPayload;
    } catch {
      throw new AppError(
        'Invalid or expired refresh token',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.REFRESH_TOKEN_INVALID
      );
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.refreshTokenHash) {
      throw new AppError(
        'Invalid refresh token',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.REFRESH_TOKEN_INVALID
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(
        'Account is not active',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.ACCOUNT_INACTIVE
      );
    }

    const isTokenValid = await compareToken(refreshToken, user.refreshTokenHash);

    if (!isTokenValid) {
      // Token reuse detected — invalidate all sessions (security measure)
      await this.userRepository.updateRefreshToken(user.id, null);
      throw new AppError(
        'Refresh token reuse detected. Please log in again.',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.REFRESH_TOKEN_INVALID
      );
    }

    const accessToken = this.generateAccessToken(user);
    return { accessToken };
  }

  // ─── Verify Access Token ──────────────────────────────────────────────────

  async verifyAccessToken(token: string): Promise<JwtAccessPayload> {
    try {
      return jwt.verify(token, jwtConfig.access.secret) as JwtAccessPayload;
    } catch {
      throw new AppError(
        'Invalid access token',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.TOKEN_INVALID
      );
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private generateAccessToken(user: {
    id: string;
    email: string;
    role: import('@prisma/client').UserRole;
    employeeId: string;
  }): string {
    const payload: JwtAccessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    return jwt.sign(payload, jwtConfig.access.secret, {
      expiresIn: jwtConfig.access.expiresIn as unknown as number,
    });
  }

  private generateRefreshToken(userId: string): string {
    const payload: JwtRefreshPayload = { sub: userId };
    return jwt.sign(payload, jwtConfig.refresh.secret, {
      expiresIn: jwtConfig.refresh.expiresIn as unknown as number,
    });
  }

  private toPublicUser(user: import('@prisma/client').User): PublicUser {
    return {
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      department: user.department,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
