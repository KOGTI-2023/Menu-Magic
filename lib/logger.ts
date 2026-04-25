type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';
import * as Sentry from '@sentry/nextjs';

// In production, default to 'warn' to save resources. In development, default to 'debug'.
// Can be overridden via environment variable NEXT_PUBLIC_LOG_LEVEL
const currentLevel: LogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 
                               (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4
};

/**
 * Centralized logger utility.
 * Allows filtering log output based on environment or configuration to save resources in production.
 */
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (levels[currentLevel] <= levels.debug) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (levels[currentLevel] <= levels.info) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (levels[currentLevel] <= levels.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (levels[currentLevel] <= levels.error) {
      console.error(`[ERROR] ${message}`, ...args);
      // Optional: Forward all errors to Sentry automatically
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        Sentry.withScope((scope) => {
          if (args.length > 0) {
            scope.setExtra("context", args);
          }
          Sentry.captureMessage(message, "error");
        });
      }
    }
  }
};
