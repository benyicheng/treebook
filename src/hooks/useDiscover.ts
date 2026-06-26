import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

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
