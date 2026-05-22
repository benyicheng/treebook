import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';
import { EditorialService } from '../domains/editorial/EditorialService';

const toInt = (v: any, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export const listEditorialChanges = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.max(1, Math.min(200, toInt(req.query.limit, 50)));
  const offset = Math.max(0, toInt(req.query.offset, 0));
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const targetType = typeof req.query.targetType === 'string' ? req.query.targetType : undefined;
  const targetId = typeof req.query.targetId === 'string' ? req.query.targetId : undefined;
  const data = await EditorialService.listChanges({ actor: (req as any).user, status, targetType, targetId, limit, offset });
  res.json({ success: true, data });
});

export const getEditorialChangeById = catchAsync(async (req: Request, res: Response) => {
  const data = await EditorialService.getChangeById({ actor: (req as any).user, id: req.params.id });
  res.json({ success: true, data });
});

export const createEditorialChange = catchAsync(async (req: Request, res: Response) => {
  const { targetType, targetId, field, proposed, submit, sanitize, normalize } = req.body || {};
  if (!targetType || !targetId || !field) throw new AppError(400, 'BAD_REQUEST', '缺少必要字段');
  const data = await EditorialService.createChange({
    actor: (req as any).user,
    targetType,
    targetId,
    field,
    proposed,
    submit,
    sanitize,
    normalize,
  } as any);
  res.status(201).json({ success: true, data });
});

export const applyEditorialChange = catchAsync(async (req: Request, res: Response) => {
  const data = await EditorialService.applyChange({ actor: (req as any).user, id: req.params.id, traceReq: req });
  res.json({ success: true, data });
});

