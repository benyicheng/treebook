import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { queryKeys } from '../lib/queryKeys';

export interface TrailNode {
  id: string;
  contentId: string;
  contentTitle: string;
  nodeCategory: 'chapter' | 'branch' | 'spinoff';
  note: string | null;
  sortOrder: number;
}

export interface ReadingPath {
  id: string;
  title: string;
  nodes: TrailNode[];
}

export interface TrailData {
  id: string;
  pathId: string;
  currentNodeIndex: number;
  completedAt: string | null;
  path: ReadingPath;
}

export function useTrail(trailId: string) {
  return useQuery({
    queryKey: ['reading-paths', 'trails', trailId],
    queryFn: () =>
      client
        .get(`/reading-paths/trails/${trailId}`)
        .then((r) => r.data?.data || r.data),
    enabled: !!trailId,
  });
}

export function useStoryReadingPaths(storyId: string | undefined, limit: number = 5) {
  return useQuery({
    queryKey: ['reading-paths', 'story', storyId],
    queryFn: async () => {
      if (!storyId) return [];
      const { data } = await client.get(`/reading-paths/universes/${storyId}`, { params: { limit } });
      return data.items || data.data || [];
    },
    enabled: !!storyId,
    staleTime: 60_000,
  });
}

export function useAdvanceTrail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (trailId: string) =>
      client
        .post(`/reading-paths/trails/${trailId}/advance`)
        .then((r) => r.data?.data || r.data),
    onSuccess: (_data, trailId) => {
      qc.invalidateQueries({ queryKey: ['reading-paths', 'trails', trailId] });
    },
  });
}
