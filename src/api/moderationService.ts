import client from './client';
import type { ModerationMetrics, ModerationDecision } from './types';
export type { ModerationMetrics, ModerationDecision };

export const moderationService = {
  getMetrics: async (sinceMinutes = 1440): Promise<ModerationMetrics> => {
    const { data } = await client.get<any>('/moderation/metrics', { params: { sinceMinutes } });
    return data;
  },

  listDecisions: async (params?: { status?: string; targetType?: string; targetId?: string; limit?: number; offset?: number }) => {
    const { data } = await client.get<any>('/moderation/decisions', { params });
    return data;
  },

  manualDecision: async (payload: { targetType: string; targetId: string; status: string; labels?: string[]; reasons?: string[] }) => {
    const { data } = await client.post<any>('/moderation/decisions/manual', payload);
    return data;
  },
};
