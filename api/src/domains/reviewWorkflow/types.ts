import type { ModerationContentType, ModerationTargetType } from '../moderation/types';

export type ReviewCaseStatus =
  | 'open'
  | 'in_review'
  | 'returned'
  | 'approved'
  | 'rejected'
  | 'closed';

export type ReviewCaseActionType =
  | 'create'
  | 'assign'
  | 'annotate'
  | 'comment'
  | 'return'
  | 'approve'
  | 'reject'
  | 'resubmit'
  | 'close';

export type ReviewCaseRow = {
  id: string;
  businessLine: string;
  targetType: ModerationTargetType;
  targetId: string;
  contentType: ModerationContentType;
  field: string | null;
  status: ReviewCaseStatus;
  level: number;
  assigneeUserId: string | null;
  sourceDecisionId: string | null;
  snapshot: string | null;
  dueAt: string | null;
  reopenedCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ReviewCaseActionRow = {
  id: string;
  caseId: string;
  action: ReviewCaseActionType;
  actorUserId: string | null;
  payload: string | null;
  createdAt: string;
};

export type ReviewCaseWithActions = ReviewCaseRow & {
  actions: ReviewCaseActionRow[];
};
