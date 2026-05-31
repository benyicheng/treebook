import { useQuery } from '@tanstack/react-query';
import searchService from '../api/searchService';
import { queryKeys } from '../lib/queryKeys';

export function useSearch(query: string, type?: string | null) {
  return useQuery({
    queryKey: queryKeys.search.results(query, type),
    queryFn: () => searchService.searchAll(query, type ?? undefined),
    enabled: true,
    staleTime: 30_000,
  });
}
