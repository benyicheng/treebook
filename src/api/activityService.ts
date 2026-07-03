import client from './client';
import type { ActivityItem } from './types';
export type { ActivityItem };

export const activityService = {
  getFeed: async (cursor?: string, limit = 30) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));
    const { data } = await client.get(`/activities/feed?${params}`);
    return data as { data: ActivityItem[]; nextCursor: string | null };
  },

  getUserActivities: async (userId: string, cursor?: string, limit = 20) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));
    const { data } = await client.get(`/activities/user/${userId}?${params}`);
    return data as { data: ActivityItem[]; nextCursor: string | null };
  },
};
