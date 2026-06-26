import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from './logger';

export const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Fire-and-forget wrapper: runs an async operation without awaiting it,
 * but catches any rejection and logs it instead of producing an unhandled
 * rejection.
 *
 * Usage:
 *   safeFireAndForget(moderateText(req, ...), { traceId: req.traceId, op: 'moderateText' });
 */
export function safeFireAndForget(
  promise: Promise<unknown>,
  ctx?: { traceId?: string; op?: string },
): void {
  promise.catch((err: unknown) => {
    logger.error('Fire-and-forget task failed', {
      ...(ctx ?? {}),
      error: err instanceof Error ? err.message : String(err),
    });
  });
}
