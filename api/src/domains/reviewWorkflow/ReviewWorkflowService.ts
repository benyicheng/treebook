import type { ModerationDecision, ModerationRequest } from '../moderation/types';
import { ReviewCaseRepository } from './ReviewCaseRepository';
import { ReviewWorkflowConfigService } from './ReviewWorkflowConfigService';

const computeDueAt = async (level: number) => {
  const cfg = await ReviewWorkflowConfigService.getConfig();
  const hit = (cfg.levels || []).find((l) => l.level === level);
  const minutes = hit?.slaMinutes ?? 60;
  return new Date(Date.now() + minutes * 60_000).toISOString();
};

export class ReviewWorkflowService {
  static async onMachineDecisionRecorded(input: {
    decisionId: string;
    decision: ModerationDecision;
    request: ModerationRequest;
  }) {
    const status = input.decision.status;
    if (status !== 'rejected' && status !== 'failed') return null;

    const existing = await ReviewCaseRepository.findOpenCase({
      targetType: input.request.targetType,
      targetId: input.request.targetId,
      contentType: input.request.contentType,
      field: input.request.field || null,
    });

    if (existing) return existing.id;

    const snapshot =
      input.request.contentType === 'text'
        ? { text: input.request.text || '', field: input.request.field || null }
        : { mediaUrl: input.request.mediaUrl || '', field: input.request.field || null };

    const caseId = await ReviewCaseRepository.createCase({
      businessLine: input.request.businessLine,
      targetType: input.request.targetType,
      targetId: input.request.targetId,
      contentType: input.request.contentType,
      field: input.request.field || null,
      sourceDecisionId: input.decisionId,
      snapshot,
      level: 1,
    });
    await ReviewCaseRepository.setDueAt(caseId, await computeDueAt(1));
    return caseId;
  }

  static async canAct(user: { role?: string; permissions?: string[] } | null | undefined, input: { level: number; action: string }) {
    if (user?.role === 'admin') return true;
    const perms = user?.permissions || [];
    if (!perms.includes('review:case:act')) return false;
    if (input.action === 'approve' || input.action === 'return') return perms.includes(`review:case:l${input.level}`) || perms.includes('review:case:any') || perms.includes('review:case:final');
    if (input.action === 'reject' || input.action === 'close') return perms.includes(`review:case:final`) || perms.includes('review:case:any');
    if (input.action === 'annotate' || input.action === 'comment' || input.action === 'assign') return true;
    return false;
  }

  static async advanceLevel(caseId: string, currentLevel: number) {
    const cfg = await ReviewWorkflowConfigService.getConfig();
    const max = cfg.maxLevel || 3;
    const next = Math.min(max, currentLevel + 1);
    await ReviewCaseRepository.moveToLevel(caseId, next);
    await ReviewCaseRepository.setDueAt(caseId, await computeDueAt(next));
    return next;
  }

  static async markReturned(caseId: string, level: number) {
    await ReviewCaseRepository.setCaseStatus(caseId, 'returned');
    await ReviewCaseRepository.setDueAt(caseId, await computeDueAt(level));
  }

  static async onContentUpdated(input: {
    actorUserId: string | null;
    businessLine: string;
    targetType: ModerationRequest['targetType'];
    targetId: string;
    contentType: ModerationRequest['contentType'];
    field?: string | null;
    snapshot: unknown;
  }) {
    const cfg = await ReviewWorkflowConfigService.getConfig();
    if (!cfg.enabled) return null;

    const existing = await ReviewCaseRepository.findOpenCase({
      targetType: input.targetType,
      targetId: input.targetId,
      contentType: input.contentType,
      field: input.field || null,
    });
    if (!existing) return null;
    if (existing.status !== 'returned') return existing.id;

    await ReviewCaseRepository.reopenWithSnapshot(existing.id, input.snapshot, existing.sourceDecisionId);
    await ReviewCaseRepository.setDueAt(existing.id, await computeDueAt(existing.level));
    await ReviewCaseRepository.addAction(existing.id, {
      action: 'resubmit',
      actorUserId: input.actorUserId,
      payload: { field: input.field || null },
    });
    return existing.id;
  }
}
