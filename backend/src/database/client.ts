import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../config/logger';

// ─── Singleton Prisma Client ──────────────────────────────────────────────────
// A single PrismaClient instance is used throughout the application lifecycle.
// Instantiating multiple clients causes connection pool exhaustion.

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: env.app.isDevelopment
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ]
      : [{ emit: 'event', level: 'error' }],
  });
};

// In development, reuse the global instance to prevent connection pool
// exhaustion during hot-module reloads with ts-node-dev.
export const prisma: PrismaClient =
  global.__prisma ?? createPrismaClient();

if (env.app.isDevelopment) {
  global.__prisma = prisma;

  // Log slow queries in development
  (prisma as any).$on('query', (e: { query: string; duration: number }) => {
    if (e.duration > 200) {
      logger.warn(`Slow query detected (${e.duration}ms): ${e.query}`);
    }
  });
}

(prisma as any).$on('error', (e: { message: string }) => {
  logger.error('Prisma error:', { message: e.message });
});

// ─── Connection Test ─────────────────────────────────────────────────────────

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed', { error });
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
