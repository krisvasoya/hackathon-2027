import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { morganStream } from './config/logger';
import apiRoutes from './routes';
import { globalErrorHandler, notFoundHandler } from './middleware/error.middleware';

// ─── Express Application ──────────────────────────────────────────────────────

const app: Application = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: env.app.isProduction,
    crossOriginEmbedderPolicy: env.app.isProduction,
  })
);

app.use(
  cors({
    origin: env.app.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Global Rate Limiting ─────────────────────────────────────────────────────

app.use(
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests. Please slow down.',
      code: 'RL_001',
      timestamp: new Date().toISOString(),
    },
  })
);

// ─── Request Middleware ───────────────────────────────────────────────────────

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── HTTP Request Logging ─────────────────────────────────────────────────────

app.use(
  morgan(env.app.isDevelopment ? 'dev' : 'combined', { stream: morganStream })
);

// ─── Trust Proxy (for rate limiting behind reverse proxy) ─────────────────────

if (env.app.isProduction) {
  app.set('trust proxy', 1);
}

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api', apiRoutes);

// ─── 404 & Error Handlers (must be last) ─────────────────────────────────────

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
