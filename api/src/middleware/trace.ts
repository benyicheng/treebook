import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export type TraceRequest = Request & { traceId?: string };

export const trace = (req: TraceRequest, res: Response, next: NextFunction) => {
  const incoming = req.header('x-trace-id');
  const traceId = incoming && incoming.length <= 128 ? incoming : crypto.randomUUID();
  req.traceId = traceId;
  res.setHeader('x-trace-id', traceId);
  next();
};

