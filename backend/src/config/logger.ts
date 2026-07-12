import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env } from './env';

// ─── Custom Log Format ────────────────────────────────────────────────────────

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString =
      Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    const stackString = stack ? `\n${stack}` : '';
    return `[${timestamp}] ${level.toUpperCase().padEnd(5)} ${message}${metaString}${stackString}`;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ─── Transports ───────────────────────────────────────────────────────────────

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: env.app.isDevelopment
      ? winston.format.combine(winston.format.colorize(), logFormat)
      : jsonFormat,
  }),
];

if (!env.app.isTest) {
  // Error log — rotated daily, kept 30 days
  transports.push(
    new DailyRotateFile({
      filename: path.join(env.logging.dir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      format: jsonFormat,
    })
  );

  // Combined log — rotated daily, kept 14 days
  transports.push(
    new DailyRotateFile({
      filename: path.join(env.logging.dir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      format: jsonFormat,
    })
  );
}

// ─── Logger Instance ─────────────────────────────────────────────────────────

export const logger = winston.createLogger({
  level: env.logging.level,
  transports,
  exitOnError: false,
});

// ─── Morgan Stream ────────────────────────────────────────────────────────────

export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};
