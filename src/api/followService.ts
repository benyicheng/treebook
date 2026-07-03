import client from './client';
import type { FollowActivityItem } from './types';
export type { FollowActivityItem };

export const followService = {
  follow: async (followingId: string) => {
    const { data } = await client.post('/follows/follow', { followingId });
    return data;
  },

  unfollow: async (followingId: string) => {
    const { data } = await client.post('/follows/unfollow', { followingId });
    return data;
  },

  getActivity: async (cursor?: string, limit = 30) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));
    const { data } = await client.get(`/follows/activity?${params}`);
    return data as { data: FollowActivityItem[]; nextCursor: string | null };
  },

  getFollowers: async (userId: string, cursor?: string, limit = 20) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));
    const { data } = await client.get(`/follows/${userId}/followers?${params}`);
    return data as { data: { id: string; username: string; avatarUrl?: string; followerCount: number }[]; nextCursor: string | null };
  },

  getFollowing: async (userId: string, cursor?: string, limit = 20) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));
    const { data } = await client.get(`/follows/${userId}/following?${params}`);
    return data as { data: { id: string; username: string; avatarUrl?: string; followerCount: number }[]; nextCursor: string | null };
  },

  checkFollowStatus: async (targetId: string) => {
    const { data } = await client.get(`/follows/status?targetId=${targetId}`);
    return data as { isFollowing: boolean };
  },

  batchFollowStatus: async (targetIds: string[]) => {
    const { data } = await client.post('/follows/batch-status', { targetIds });
    return data as Record<string, boolean>;
  },
};
