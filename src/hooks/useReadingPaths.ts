import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

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
  booklistId?: string | null;
  nodes: TrailNode[];
}

export interface TrailData {
  id: string;
  pathId: string;
  currentNodeIndex: number;
  completedAt: string | null;
  path: ReadingPath;
}

export function useReadingPath(pathId: string) {
  return useQuery({
    queryKey: ['reading-paths', pathId],
    queryFn: () =>
      client
        .get(`/reading-paths/${pathId}`)
        .then((r) => r.data?.data || r.data),
    enabled: !!pathId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTrail(trailId: string) {
  return useQuery({
    queryKey: ['reading-paths', 'trails', trailId],
    queryFn: () =>
      client
        .get(`/reading-paths/trails/${trailId}`)
        .then((r) => r.data?.data || r.data),
    enabled: !!trailId,
    retry: false,
  });
}


