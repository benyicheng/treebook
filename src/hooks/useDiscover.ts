import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { discoverService } from '../api/discoverService';
import { queryKeys } from '../lib/queryKeys';

export function useUniverseFeed(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  tag?: string;
}) {
  return useQuery({
    queryKey: queryKeys.discover.feed(params as Record<string, unknown>),
    queryFn: () => discoverService.getUniverseFeed('hot', params?.page, params?.limit),
  });
}

export function useHotReadingPaths() {
  return useQuery({
    queryKey: ['reading-paths', 'hot'],
    queryFn: async () => {
      const { data } = await client.get('/reading-paths', { params: { sortBy: 'hot', limit: 5 } });
      return data.items || data.data || [];
    },
    staleTime: 60_000,
  });
}
