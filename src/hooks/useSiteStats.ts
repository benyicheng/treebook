import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface SiteStats {
  stories: number;
  users: number;
  branches: number;
}

export function useSiteStats() {
  return useQuery({
    queryKey: ['site', 'stats'],
    queryFn: async () => {
      const res = await client.get('/cms/stats');
      return (res.data?.data || res.data || {}) as SiteStats;
    },
    staleTime: 60_000, // 1 minute
  });
}
