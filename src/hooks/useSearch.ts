import { useQuery } from '@tanstack/react-query';
import searchService from '../api/searchService';
import { queryKeys } from '../lib/queryKeys';

export function useSearch(query: string, type?: string | null, limit?: number, offset?: number, sort?: 'relevance' | 'newest') {
  return useQuery({
    queryKey: queryKeys.search.results(query, type, limit, offset, sort),
    queryFn: () => searchService.searchAll(query, type ?? undefined, limit, offset, sort),
    enabled: true,
    staleTime: 30_000,
  });
}
