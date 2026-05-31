import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storyService } from '../api/storyService';
import { queryKeys } from '../lib/queryKeys';

export function useStories(params?: {
  tag?: string;
  isOfficial?: boolean;
  q?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.stories.list(params as Record<string, unknown>),
    queryFn: () => storyService.getAll(params),
    staleTime: 60_000,
  });
}

export function useStory(id: string) {
  return useQuery({
    queryKey: queryKeys.stories.detail(id),
    queryFn: () => storyService.getById(id),
    enabled: !!id,
  });
}

export function useMyStories() {
  return useQuery({
    queryKey: queryKeys.stories.my,
    queryFn: () => storyService.getMy(),
  });
}

export function useRecentReads() {
  return useQuery({
    queryKey: queryKeys.stories.recent,
    queryFn: () => storyService.getRecentReads(),
  });
}

export function useStoryTags() {
  return useQuery({
    queryKey: queryKeys.stories.tags,
    queryFn: () => storyService.getTags(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storyService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
  });
}

export function useUpdateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof storyService.update>[1] }) =>
      storyService.update(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.stories.detail(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.stories.lists() });
    },
  });
}
