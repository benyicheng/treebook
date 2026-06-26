import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';
import type { ModerationDecisionStatus, ModerationTargetType } from '../domains/moderation/types';
import { ModerationAdminService } from '../domains/moderation/ModerationAdminService';

const toInt = (v: unknown, d: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const csvEscape = (v: unknown): string => {
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
  const parsedStatus = typeof req.query.status === 'string' ? req.query.status : undefined;
  const parsedTargetType = typeof req.query.targetType === 'string' ? req.query.targetType : undefined;
  const targetId = typeof req.query.targetId === 'string' ? req.query.targetId : undefined;

  const validStatuses: ModerationDecisionStatus[] = ['pending','approved','rejected','failed'];
  const status = parsedStatus && validStatuses.includes(parsedStatus as ModerationDecisionStatus)
    ? parsedStatus as ModerationDecisionStatus
    : undefined;
  const validTargetTypes: ModerationTargetType[] = ['story','chapter','comment','spinoff','booklist','booklist_item','user','character','ai_asset','media_asset'];
  const targetType = parsedTargetType && validTargetTypes.includes(parsedTargetType as ModerationTargetType)
    ? parsedTargetType as ModerationTargetType
    : undefined;

  const data = await ModerationAdminService.listDecisions({ status, targetType, targetId, limit, offset });
  res.json({ success: true, data });
});

export const manualModerationDecision = catchAsync(async (req: AuthRequest, res: Response) => {
  const actorUserId = req.user?.id;
  const body = req.body || {};
  const targetType = String(body.targetType || '');
  const targetId = String(body.targetId || '');
  const status = String(body.status || '');
  if (!targetType || !targetId || !status) throw new AppError(400, 'BAD_REQUEST', '缺少必要字段');

  const traceId = req.traceId;
  const result = await ModerationAdminService.manualDecision({
    actorUserId,
    targetType: targetType as ModerationTargetType,
    targetId,
    status: status as ModerationDecisionStatus,
    labels: Array.isArray(body.labels) ? body.labels : undefined,
    reasons: Array.isArray(body.reasons) ? body.reasons : undefined,
    traceId,
  });
  res.json({ success: true, data: result });
});

interface ModerationRow {
  id: string; jobId: string; businessLine: string; targetType: string;
  targetId: string; contentType: string; field: string | null; status: string;
  labels: string; reasons: string; score: number | null; provider: string | null;
  traceId: string | null; createdAt: string;
}

export const exportModerationReport = catchAsync(async (req: Request, res: Response) => {
  const sinceMinutes = Math.max(1, Math.min(60 * 24 * 30, toInt(req.query.sinceMinutes, 60 * 24)));
  const format = typeof req.query.format === 'string' ? req.query.format : 'json';
  const rows = await ModerationAdminService.listDecisions({ limit: 5000, offset: 0 }) as unknown as ModerationRow[];

  if (format === 'csv') {
    const header: (keyof ModerationRow)[] = [
      'id', 'jobId', 'businessLine', 'targetType', 'targetId',
      'contentType', 'field', 'status', 'labels', 'reasons',
      'score', 'provider', 'traceId', 'createdAt',
    ];
    const body = rows
      .filter((r) => String(r.createdAt) >= new Date(Date.now() - sinceMinutes * 60_000).toISOString())
      .map((r) => header.map((k) => csvEscape(r[k])).join(','))
      .join('\n');
    const out = header.join(',') + '\n' + body + '\n';
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.send(out);
    return;
  }

  const since = new Date(Date.now() - sinceMinutes * 60_000).toISOString();
  const data = rows.filter((r) => String(r.createdAt) >= since);
  res.json({ success: true, data: { since, rows: data } });
});

