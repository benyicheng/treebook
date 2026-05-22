import client from './client';

export type ModerationMetrics = {
  since: string;
  byStatus: Array<{ status: string; count: number }>;
  byProvider: Array<{ provider: string; count: number }>;
  byTargetType: Array<{ targetType: string; count: number }>;
};

export type ModerationDecision = {
  id: string;
  jobId: string;
  businessLine: string;
  targetType: string;
  targetId: string;
  contentType: string;
  field?: string;
  status: 'pending' | 'approved' | 'rejected' | 'failed';
  labels?: string;
  reasons?: string;
  score?: number;
  provider?: string;
  traceId?: string;
  createdAt: string;
};

export const moderationService = {
  getMetrics: async (sinceMinutes = 1440): Promise<ModerationMetrics> => {
    const { data } = await client.get<any>('/moderation/metrics', { params: { sinceMinutes } });
    return data.data || data;
  },

  listDecisions: async (params?: { status?: string; targetType?: string; targetId?: string; limit?: number; offset?: number }) => {
    const { data } = await client.get<any>('/moderation/decisions', { params });
    return data.data || data;
  },

  manualDecision: async (payload: { targetType: string; targetId: string; status: string; labels?: string[]; reasons?: string[] }) => {
    const { data } = await client.post<any>('/moderation/decisions/manual', payload);
    return data.data || data;
  },
};

