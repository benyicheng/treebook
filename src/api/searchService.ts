import client from './client';
import type { SearchResultItem, SearchResult, SearchSuggestItem } from './types';
export type { SearchResultItem, SearchResult, SearchSuggestItem };

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
