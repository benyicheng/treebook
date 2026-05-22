import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';
import { ModerationAdminService } from '../domains/moderation/ModerationAdminService';

const toInt = (v: any, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const csvEscape = (v: any) => {
  const s = String(v ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export const getModerationMetrics = catchAsync(async (req: Request, res: Response) => {
  const sinceMinutes = Math.max(1, Math.min(60 * 24 * 30, toInt(req.query.sinceMinutes, 60 * 24)));
  const data = await ModerationAdminService.getMetrics(sinceMinutes);
  res.json({ success: true, data });
});

export const listModerationDecisions = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.max(1, Math.min(200, toInt(req.query.limit, 50)));
  const offset = Math.max(0, toInt(req.query.offset, 0));
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const targetType = typeof req.query.targetType === 'string' ? req.query.targetType : undefined;
  const targetId = typeof req.query.targetId === 'string' ? req.query.targetId : undefined;

  const data = await ModerationAdminService.listDecisions({
    status: status as any,
    targetType: targetType as any,
    targetId,
    limit,
    offset,
  });
  res.json({ success: true, data });
});

export const manualModerationDecision = catchAsync(async (req: Request, res: Response) => {
  const actorUserId = (req as any).user?.id;
  const { targetType, targetId, status, labels, reasons } = req.body || {};
  if (!targetType || !targetId || !status) throw new AppError(400, 'BAD_REQUEST', '缺少必要字段');

  const traceId = (req as any).traceId;
  const result = await ModerationAdminService.manualDecision({
    actorUserId,
    targetType,
    targetId,
    status,
    labels,
    reasons,
    traceId,
  } as any);
  res.json({ success: true, data: result });
});

export const exportModerationReport = catchAsync(async (req: Request, res: Response) => {
  const sinceMinutes = Math.max(1, Math.min(60 * 24 * 30, toInt(req.query.sinceMinutes, 60 * 24)));
  const format = typeof req.query.format === 'string' ? req.query.format : 'json';
  const rows = await ModerationAdminService.listDecisions({ limit: 5000, offset: 0 } as any);

  if (format === 'csv') {
    const header = [
      'id',
      'jobId',
      'businessLine',
      'targetType',
      'targetId',
      'contentType',
      'field',
      'status',
      'labels',
      'reasons',
      'score',
      'provider',
      'traceId',
      'createdAt',
    ];
    const body = rows
      .filter((r: any) => String(r.createdAt) >= new Date(Date.now() - sinceMinutes * 60_000).toISOString())
      .map((r: any) => header.map((k) => csvEscape(r[k])).join(','))
      .join('\n');
    const out = header.join(',') + '\n' + body + '\n';
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.send(out);
    return;
  }

  const since = new Date(Date.now() - sinceMinutes * 60_000).toISOString();
  const data = rows.filter((r: any) => String(r.createdAt) >= since);
  res.json({ success: true, data: { since, rows: data } });
});

