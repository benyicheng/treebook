import client from './client';

export interface ActivityItem {
  id: string;
  actorId: string;
  actor: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  type: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, any> | null;
  createdAt: string;
}

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
