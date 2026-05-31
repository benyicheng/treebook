import client from './client';

export interface FollowUser {
  id: string;
  username: string;
  avatarUrl?: string;
  followerCount: number;
}

export interface ActivityItem {
  id: string;
  type: 'story' | 'branch' | 'spinoff';
  title: string;
  description: string;
  storyId?: string;
  author: { id: string; username: string; avatarUrl: string | null } | null;
  createdAt: string;
  viewCount?: number;
  likeCount?: number;
}

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
    return data as { data: ActivityItem[]; nextCursor: string | null };
  },

  getFollowers: async (userId: string, cursor?: string, limit = 20) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));
    const { data } = await client.get(`/follows/${userId}/followers?${params}`);
    return data as { data: FollowUser[]; nextCursor: string | null };
  },

  getFollowing: async (userId: string, cursor?: string, limit = 20) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));
    const { data } = await client.get(`/follows/${userId}/following?${params}`);
    return data as { data: FollowUser[]; nextCursor: string | null };
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
