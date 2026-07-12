import './config/env'; // Must be first — validates environment variables
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './database/client';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  logger.info(`Starting ${env.app.name} v${env.app.version} [${env.app.nodeEnv}]`);

  // Connect to database first — fail fast if unavailable
  await connectDatabase();

  const server = app.listen(env.app.port, () => {
    logger.info(`🚀 Server running on http://localhost:${env.app.port}`);
    logger.info(`📋 Health check: http://localhost:${env.app.port}/api/health`);
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────────────

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDatabase();
      logger.info('Database disconnected — shutdown complete');
      process.exit(0);
    });

    // Force shutdown if graceful close hangs
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ─── Unhandled Rejection Safety Net ──────────────────────────────────────

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception — shutting down', { error });
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
