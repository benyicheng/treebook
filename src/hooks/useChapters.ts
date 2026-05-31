import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chapterService } from '../api/storyService';
import { queryKeys } from '../lib/queryKeys';

export function useChapter(id: string, referralId?: string) {
  return useQuery({
    queryKey: queryKeys.chapters.detail(id),
    queryFn: () => chapterService.getById(id, referralId),
    enabled: !!id,
  });
}

export function useChaptersByStory(storyId: string, branchId?: string) {
  return useQuery({
    queryKey: queryKeys.chapters.byStory(storyId, branchId),
    queryFn: () => chapterService.getByStory(storyId, branchId, true),
    enabled: !!storyId,
  });
}

export function useChapterComments(chapterId: string) {
  return useQuery({
    queryKey: queryKeys.chapters.comments(chapterId),
    queryFn: () => chapterService.getComments(chapterId),
    enabled: !!chapterId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chapterId, content }: { chapterId: string; content: string }) =>
      chapterService.createComment(chapterId, content),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.chapters.comments(vars.chapterId) });
    },
  });
}

export function useCreateChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chapterService.create,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.stories.detail(vars.storyId!) });
      qc.invalidateQueries({ queryKey: queryKeys.chapters.all });
    },
  });
}

export function useUpdateChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof chapterService.update>[1] }) =>
      chapterService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.chapters.all });
      qc.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
  });
}
