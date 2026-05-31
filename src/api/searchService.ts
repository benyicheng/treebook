import client from './client';

export interface SearchResultItem {
  title: string;
  type: 'story' | 'chapter' | 'branch' | 'spinoff' | 'author';
  sourceId: string;
  highlight: string;
  metadata: {
    storyId?: string;
    authorId?: string;
    branchId?: string;
  };
  rank: number;
}

export interface SearchResult {
  results: SearchResultItem[];
  total: number;
  query: string;
  type: string | null;
}

const searchService = {
  async searchAll(query: string, type?: string, limit = 20, offset = 0): Promise<SearchResult> {
    const params = new URLSearchParams({ q: query, limit: String(limit), offset: String(offset) });
    if (type && type !== 'all') {
      params.set('type', type);
    }
    const { data } = await client.get<SearchResult>(`/search?${params.toString()}`);
    return data;
  },
};

export default searchService;
