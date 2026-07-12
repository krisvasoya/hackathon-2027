import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before anything else
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Validation Helper ────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: ${key}\n` +
        `Ensure .env exists and contains a value for ${key}.`
    );
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

// ─── Parsed Configuration ────────────────────────────────────────────────────

export const env = {
  app: {
    name: optionalEnv('APP_NAME', 'TransitOps'),
    version: optionalEnv('APP_VERSION', '1.0.0'),
    nodeEnv: optionalEnv('NODE_ENV', 'development'),
    port: parseInt(optionalEnv('PORT', '5000'), 10),
    frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:5173'),
    isDevelopment: optionalEnv('NODE_ENV', 'development') === 'development',
    isProduction: optionalEnv('NODE_ENV', 'development') === 'production',
    isTest: optionalEnv('NODE_ENV', 'development') === 'test',
  },
  db: {
    url: requireEnv('DATABASE_URL'),
  },
  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiresIn: optionalEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  },
  bcrypt: {
    saltRounds: parseInt(optionalEnv('BCRYPT_SALT_ROUNDS', '12'), 10),
  },
  rateLimit: {
    windowMs: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    maxRequests: parseInt(optionalEnv('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
    authMaxRequests: parseInt(
      optionalEnv('AUTH_RATE_LIMIT_MAX_REQUESTS', '10'),
      10
    ),
  },
  logging: {
    level: optionalEnv('LOG_LEVEL', 'info'),
    dir: optionalEnv('LOG_DIR', 'logs'),
  },
} as const;

export type EnvConfig = typeof env;
