import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendNoContent, sendError } from '../utils/response.util';
import { cookieConfig } from '../config/jwt';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

// ─── Auth Controller ──────────────────────────────────────────────────────────
// Controllers ONLY:
//   1. Extract data from request
//   2. Call service
//   3. Send response
// Controllers NEVER contain business logic.

export class AuthController {
  private readonly authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // ─── POST /api/auth/login ────────────────────────────────────────────────

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';

      const tokens = await this.authService.login(
        email,
        password,
        ipAddress,
        userAgent
      );

      // Refresh token delivered via httpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, cookieConfig.refreshToken);

      sendSuccess(
        res,
        {
          accessToken: tokens.accessToken,
          user: tokens.user,
        },
        'Login successful'
      );
    } catch (error) {
      next(error);
    }
  };

  // ─── POST /api/auth/refresh ──────────────────────────────────────────────

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Accept token from httpOnly cookie (preferred) or request body (fallback)
      const refreshToken =
        (req.cookies as { refreshToken?: string }).refreshToken ??
        (req.body as { refreshToken?: string }).refreshToken;

      if (!refreshToken) {
        sendError(
          res,
          'Refresh token is required',
          ERROR_CODES.REFRESH_TOKEN_INVALID,
          HTTP_STATUS.UNAUTHORIZED
        );
        return;
      }

      const { accessToken } = await this.authService.refreshAccessToken(refreshToken);
      sendSuccess(res, { accessToken }, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  // ─── POST /api/auth/logout ───────────────────────────────────────────────

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await this.authService.logout(user.sub);

      res.clearCookie('refreshToken', { path: '/api/auth' });
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };

  // ─── GET /api/auth/me ────────────────────────────────────────────────────

  getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      sendSuccess(res, { user }, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
