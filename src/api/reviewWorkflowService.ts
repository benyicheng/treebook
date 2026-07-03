import client from './client';
import type { ReviewCase, ReviewCaseAction, ReviewCaseDetail } from './types';
export type { ReviewCase, ReviewCaseAction, ReviewCaseDetail };

export const reviewWorkflowService = {
  listCases: async (params?: { businessLine?: string; status?: string; level?: number; limit?: number; offset?: number }) => {
    const res = await client.get('/review-workflow/cases', { params });
    return res.data as { items: ReviewCase[]; total: number };
  },

  getCaseDetail: async (id: string) => {
    const res = await client.get(`/review-workflow/cases/${id}`);
    return res.data as ReviewCaseDetail;
  },

  addAction: async (id: string, payload: { action: string; comment?: string }) => {
    const res = await client.post(`/review-workflow/cases/${id}/actions`, payload);
    return res.data as ReviewCaseAction;
  },
};
