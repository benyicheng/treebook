import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';
import { ReviewCaseRepository } from '../domains/reviewWorkflow/ReviewCaseRepository';
import { ModerationAdminService } from '../domains/moderation/ModerationAdminService';
import { ReviewWorkflowService } from '../domains/reviewWorkflow/ReviewWorkflowService';
import { ReviewWorkflowConfigService } from '../domains/reviewWorkflow/ReviewWorkflowConfigService';

const toInt = (v: any, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export const listReviewCases = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.max(1, Math.min(200, toInt(req.query.limit, 50)));
  const offset = Math.max(0, toInt(req.query.offset, 0));
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const level = req.query.level ? Math.max(1, Math.min(5, toInt(req.query.level, 1))) : undefined;

  const data = await ReviewCaseRepository.listCases({ status, level, limit, offset });
  res.json({ success: true, data });
});

export const getReviewCaseById = catchAsync(async (req: Request, res: Response) => {
  const row = await ReviewCaseRepository.getCaseById(req.params.id);
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Case not found');
  res.json({ success: true, data: row });
});

export const addReviewCaseAction = catchAsync(async (req: Request, res: Response) => {
  const actorUserId = (req as any).user?.id || null;
  const traceId = (req as any).traceId;
  const caseId = req.params.id;
  const { action, payload } = req.body || {};
  if (!action) throw new AppError(400, 'BAD_REQUEST', '缺少 action');

  const row = await ReviewCaseRepository.getCaseById(caseId);
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Case not found');
  const canAct = await ReviewWorkflowService.canAct((req as any).user, { level: row.level, action });
  if (!canAct) throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');

  if (action === 'assign') {
    const assigneeUserId = payload?.assigneeUserId ?? null;
    await ReviewCaseRepository.assign(caseId, assigneeUserId);
    await ReviewCaseRepository.addAction(caseId, { action, actorUserId, payload: { assigneeUserId } });
    res.json({ success: true, data: { ok: true } });
    return;
  }

  if (action === 'annotate' || action === 'comment') {
    await ReviewCaseRepository.addAction(caseId, { action, actorUserId, payload });
    res.json({ success: true, data: { ok: true } });
    return;
  }

  if (action === 'return') {
    await ReviewWorkflowService.markReturned(caseId, row.level);
    await ReviewCaseRepository.addAction(caseId, { action, actorUserId, payload });
    res.json({ success: true, data: { ok: true } });
    return;
  }

  if (action === 'approve' || action === 'reject') {
    const cfg = await ReviewWorkflowConfigService.getConfig();
    const maxLevel = cfg.maxLevel || 3;
    const isFinalApprove = action === 'approve' && row.level >= maxLevel;

    const labels = Array.isArray(payload?.labels) ? payload.labels : undefined;
    const reasons = Array.isArray(payload?.reasons) ? payload.reasons : undefined;

    if (action === 'approve' && !isFinalApprove) {
      const next = await ReviewWorkflowService.advanceLevel(caseId, row.level);
      await ReviewCaseRepository.addAction(caseId, { action: 'approve', actorUserId, payload: { ...payload, toLevel: next } });
      res.json({ success: true, data: { ok: true, nextLevel: next } });
      return;
    }

    const finalStatus = action === 'approve' ? 'approved' : 'rejected';
    const decisionStatus = action === 'approve' ? 'approved' : 'rejected';
    await ReviewCaseRepository.setCaseStatus(caseId, finalStatus);
    await ReviewCaseRepository.setDueAt(caseId, null);
    await ReviewCaseRepository.addAction(caseId, { action, actorUserId, payload });

    await ModerationAdminService.manualDecision({
      actorUserId: actorUserId || undefined,
      targetType: row.targetType as any,
      targetId: row.targetId,
      status: decisionStatus as any,
      labels,
      reasons,
      traceId,
    });

    res.json({ success: true, data: { ok: true, status: finalStatus } });
    return;
  }

  if (action === 'close') {
    await ReviewCaseRepository.setCaseStatus(caseId, 'closed');
    await ReviewCaseRepository.addAction(caseId, { action, actorUserId, payload });
    res.json({ success: true, data: { ok: true } });
    return;
  }

  throw new AppError(400, 'BAD_REQUEST', '不支持的 action');
});

