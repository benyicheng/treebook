import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { readingProgressService } from '../api/readingProgressService';
import { useAuthStore } from '../stores/useAuthStore';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook: 批量获取当前用户对指定章节的阅读进度
 * @param chapterIds 可选，限制返回的章节 ID 列表
 */
export function useReadingProgress(chapterIds?: string[]) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.readingProgress.progress(chapterIds),
    queryFn: () => readingProgressService.getProgress(chapterIds),
    enabled: !!user,
    staleTime: 30_000, // 30s 内不重新请求
  });
}

/**
 * Hook: 获取当前用户的阅读统计（总/已完成/进行中）
 */
export function useReadingStats() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.readingProgress.stats,
    queryFn: readingProgressService.getStats,
    enabled: !!user,
    staleTime: 60_000,
  });
}

/**
 * Hook: 更新阅读进度（upsert）
 * 成功后会 invalidate 所有 readingProgress 查询
 */
export function useUpsertReadingProgress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      chapterId,
      ...payload
    }: {
      chapterId: string;
      status?: 'reading' | 'completed';
      progress?: number;
      currentPage?: number;
      source?: string;
      sourceId?: string;
    }) => readingProgressService.upsertProgress(chapterId, payload),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.readingProgress.all });
    },
  });
}
