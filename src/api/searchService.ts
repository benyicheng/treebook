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

export interface SearchSuggestItem {
  title: string;
  type: 'story' | 'chapter' | 'branch' | 'spinoff' | 'author';
  sourceId: string;
}

const searchService = {
  async searchAll(query: string, type?: string, limit = 20, offset = 0, sort?: 'relevance' | 'newest'): Promise<SearchResult> {
    const params = new URLSearchParams({ q: query, limit: String(limit), offset: String(offset) });
    if (type && type !== 'all') {
      params.set('type', type);
    }
    if (sort) {
      params.set('sort', sort);
    }
    const { data } = await client.get<SearchResult>(`/search?${params.toString()}`);
    return data;
  },

  async searchSuggest(query: string, limit = 5): Promise<SearchSuggestItem[]> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const { data } = await client.get<SearchSuggestItem[]>(`/search/suggest?${params.toString()}`);
    return data;
  },
};

export default searchService;
