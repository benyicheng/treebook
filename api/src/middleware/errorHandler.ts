import { Request, Response, NextFunction } from 'express';
import { sendErr } from '../utils/http';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      traceId?: string;
    }
  }
}

/**
 * Global error handling middleware.
 *
 * - 4xx (client errors) → warn level (expected, not a bug)
 * - 5xx (server errors) → error level + stack in logs; message sanitized in production
 * - Prisma errors → detected via code prefix; DB details hidden in production
 * - ZodError → 400 VALIDATION_ERROR with per-field messages
 */
export const errorHandler = (
  err: Error & { statusCode?: number; code?: string; status?: number },
  req: Request,
  res: Response,
  _next: NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  const traceId = req.traceId;
  const ctx = { traceId, method: req.method, path: req.path };

  if (err instanceof ZodError) {
    // Validation errors are expected client errors — warn, not error
    logger.warn('Validation failed', {
      ...ctx,
      issues: err.issues.map(e => `${e.path.join('.')}: ${e.message}`),
    });
    return sendErr(
      res,
      'VALIDATION_ERROR',
      '输入验证失败: ' + err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      traceId,
      400,
    );
  }

  // Prisma database errors — hide internals in production
  if (err.code && err.code.startsWith('P')) {
    logger.error('Database error', {
      ...ctx,
      prismaCode: err.code,
      message: err.message,
      stack: err.stack,
    });
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction
      ? '服务暂时不可用，请稍后重试'
      : '数据库操作异常: ' + err.message;
    return sendErr(res, 'DATABASE_ERROR', message, traceId, 500);
  }

  const status = err.statusCode || err.status || 500;
  const isServerError = status >= 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isServerError) {
    // 5xx → error level with full stack for debugging
    logger.error('Unhandled server error', {
      ...ctx,
      err: { message: err.message, stack: err.stack, code: err.code },
    });
  } else {
    // 4xx → warn level (client-caused, not a bug; no stack needed)
    logger.warn('Client error', { ...ctx, status, code: err.code, message: err.message });
  }

  // Sanitize: in production, 5xx messages must not leak internal details
  const message = isServerError && isProduction
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  const code = err.code || 'INTERNAL_ERROR';
  sendErr(res, code, message, traceId, status);
};
