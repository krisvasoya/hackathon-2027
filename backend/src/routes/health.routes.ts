import { Router, Request, Response } from 'express';
import { prisma } from '../database/client';
import { sendSuccess } from '../utils/response.util';
import { env } from '../config/env';

const router = Router();

// ─── GET /api/health ─────────────────────────────────────────────────────────

router.get('/', async (_req: Request, res: Response) => {
  let dbStatus: 'healthy' | 'unhealthy' = 'unhealthy';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'healthy';
  } catch {
    dbStatus = 'unhealthy';
  }

  sendSuccess(
    res,
    {
      status: 'operational',
      version: env.app.version,
      environment: env.app.nodeEnv,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        api: 'healthy',
      },
    },
    'Service is healthy'
  );
});

export default router;
