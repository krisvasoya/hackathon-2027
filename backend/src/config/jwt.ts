import { env } from './env';

// ─── JWT Configuration ────────────────────────────────────────────────────────

export const jwtConfig = {
  access: {
    secret: env.jwt.accessSecret,
    expiresIn: env.jwt.accessExpiresIn,
  },
  refresh: {
    secret: env.jwt.refreshSecret,
    expiresIn: env.jwt.refreshExpiresIn,
  },
} as const;

// ─── Cookie Configuration ─────────────────────────────────────────────────────

export const cookieConfig = {
  refreshToken: {
    httpOnly: true,
    secure: env.app.isProduction,
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/api/auth',
  },
} as const;
