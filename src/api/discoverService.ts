import client from './client';
import type { UniverseFeedItem } from './types';
export type { UniverseFeedItem };

export interface UniverseFeedResponse {
  items: UniverseFeedItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const discoverService = {
  async getFeed(params?: { sortBy?: string; limit?: number; page?: number }) {
    const { data } = await client.get<any>('/discover/feed', { params });
    return data;
  },

  async getByStory(storyId: string) {
    const { data } = await client.get<any>(`/discover/story/${storyId}`);
    return data;
  },

  async getUniverseFeed(tab: string, page: number, limit: number): Promise<UniverseFeedResponse> {
    const { data } = await client.get<UniverseFeedResponse>('/discover/universes', {
      params: { tab, page, limit },
    });
    return data;
  },
};
