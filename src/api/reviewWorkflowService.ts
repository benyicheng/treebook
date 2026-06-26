import client from './client';

export type ReviewCase = {
  id: string;
  businessLine: string;
  targetType: string;
  targetId: string;
  contentType: string;
  field: string | null;
  status: string;
  level: number;
  assigneeUserId: string | null;
  sourceDecisionId: string | null;
  snapshot: string | null;
  dueAt?: string | null;
  reopenedCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ReviewCaseAction = {
  id: string;
  caseId: string;
  action: string;
  actorUserId: string | null;
  payload: string | null;
  createdAt: string;
};

export type ReviewCaseDetail = ReviewCase & { actions: ReviewCaseAction[] };

export const reviewWorkflowService = {
  async listCases(params: { status?: string; level?: number; limit?: number; offset?: number }) {
    const res = await client.get('/review-workflow/cases', { params });
    return res.data as ReviewCase[];
  },

  async getCaseById(id: string) {
    const res = await client.get(`/review-workflow/cases/${id}`);
    return res.data as ReviewCaseDetail;
  },

  async addAction(id: string, input: { action: string; payload?: unknown }) {
    const res = await client.post(`/review-workflow/cases/${id}/actions`, input);
    return res.data as { ok: boolean };
  },
};
