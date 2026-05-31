import { Request, Response, NextFunction } from 'express';
import { sendErr } from '../utils/http';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const traceId = (req as any).traceId;

  // Always log full error internally (with traceId for correlation)
  logger.error('Unhandled error', {
    traceId,
    method: req.method,
    path: req.path,
    err: err instanceof Error ? { message: err.message, stack: err.stack, code: (err as any).code } : err,
  });

  if (err instanceof ZodError) {
    return sendErr(
      res, 
      'VALIDATION_ERROR', 
      '输入验证失败: ' + err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), 
      traceId, 
      400
    );
  }

  // Handle Prisma errors — 生产环境脱敏，避免泄露表名/字段名
  if (err.code && err.code.startsWith('P')) {
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction
      ? '服务暂时不可用，请稍后重试'
      : '数据库操作异常: ' + err.message;
    return sendErr(res, 'DATABASE_ERROR', message, traceId, 500);
  }

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  sendErr(res, code, message, traceId, status);
};
