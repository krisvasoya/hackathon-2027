import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { loginValidator, refreshTokenValidator } from '../validators/auth.validator';
import { handleValidationErrors } from '../middleware/validation.middleware';
import { env } from '../config/env';

const router = Router();
const authController = new AuthController();

// ─── Auth Rate Limiter ────────────────────────────────────────────────────────
// Stricter rate limit on auth endpoints to prevent brute-force attacks.

const authRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMaxRequests,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    code: 'RL_001',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/auth/login
router.post(
  '/login',
  authRateLimiter,
  loginValidator,
  handleValidationErrors,
  authController.login
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  authRateLimiter,
  refreshTokenValidator,
  handleValidationErrors,
  authController.refresh
);

// POST /api/auth/logout  (requires valid access token)
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me  (requires valid access token)
router.get('/me', authenticate, authController.getMe);

export default router;
