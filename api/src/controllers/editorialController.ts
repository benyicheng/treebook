import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';
import { EditorialService } from '../domains/editorial/EditorialService';
import type { EditorialTargetType, EditorialField } from '../domains/editorial/types';

const toInt = (v: any, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export const listEditorialChanges = catchAsync(async (req: AuthRequest, res: Response) => {
  const limit = Math.max(1, Math.min(200, toInt(req.query.limit, 50)));
  const offset = Math.max(0, toInt(req.query.offset, 0));
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const targetType = typeof req.query.targetType === 'string' ? req.query.targetType : undefined;
  const targetId = typeof req.query.targetId === 'string' ? req.query.targetId : undefined;
  const data = await EditorialService.listChanges({ actor: req.user ?? null, status, targetType, targetId, limit, offset });
  res.json({ success: true, data });
});

export const getEditorialChangeById = catchAsync(async (req: AuthRequest, res: Response) => {
  const data = await EditorialService.getChangeById({ actor: req.user ?? null, id: req.params.id });
  res.json({ success: true, data });
});

export const createEditorialChange = catchAsync(async (req: AuthRequest, res: Response) => {
  // targetType / field are constrained by the createEditorialChangeRequest zod schema,
  // so casting them to their union types (not `any`) preserves type safety.
  const targetType = req.body?.targetType as EditorialTargetType;
  const field = req.body?.field as EditorialField;
  const { targetId, proposed, submit, sanitize, normalize } = req.body || {};
  if (!targetType || !targetId || !field) throw new AppError(400, 'BAD_REQUEST', '缺少必要字段');
  const data = await EditorialService.createChange({
    actor: req.user ?? null,
    targetType,
    targetId,
    field,
    proposed,
    submit,
    sanitize,
    normalize,
  });
  res.status(201).json({ success: true, data });
});

export const applyEditorialChange = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
  const data = await EditorialService.applyChange({ actor: req.user, id: req.params.id, traceReq: req });
  res.json({ success: true, data });
});

