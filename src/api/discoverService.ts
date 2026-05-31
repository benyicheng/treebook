import client from './client';

export interface UniverseFeedItem {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  branchCount: number;
  chapterCount: number;
  spinoffCount: number;
  readingPathCount: number;
  activeReaders: number;
  hotPathsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UniverseFeedResult {
  items: UniverseFeedItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const discoverService = {
  getUniverseFeed: async (tab: 'hot' | 'latest' = 'hot', page = 1, limit = 20) => {
    const { data } = await client.get<UniverseFeedResult>('/discover/universes', {
      params: { tab, page, limit },
    });
    return data;
  },
};
