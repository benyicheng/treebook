import { Request, Response, NextFunction } from 'express';
import { sendErr } from '../utils/http';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error Handler]', err);

  const traceId = (req as any).traceId;

  if (err instanceof ZodError) {
    return sendErr(
      res, 
      'VALIDATION_ERROR', 
      '输入验证失败: ' + err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), 
      traceId, 
      400
    );
  }

  // Handle Prisma errors if needed
  if (err.code && err.code.startsWith('P')) {
    return sendErr(res, 'DATABASE_ERROR', '数据库操作异常: ' + err.message, traceId, 500);
  }

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  sendErr(res, code, message, traceId, status);
};
