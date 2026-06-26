import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { storyService, Story } from '../api/storyService';
import client from '../api/client';
import { queryKeys } from '../lib/queryKeys';

export interface RecItem {
  id: string;
  type: 'story' | 'branch' | 'spinoff';
  title: string;
  description: string;
  author: { id: string; username: string; avatarUrl: string | null } | null;
  storyId: string;
  viewCount: number;
  reason: 'following_network' | 'similar_tags' | 'hot';
}

export function useRecommendations(limit = 16) {
  return useQuery({
    queryKey: ['recommendations', 'forYou', limit],
    queryFn: async () => {
      try {
        const res = await client.get('/recommendations/for-you', {
          params: { limit },
        });
        return (res.data?.data || res.data || []) as RecItem[];
      } catch {
        // 静默处理异常（未登录 / 网络错误），返回空数组让调用方走 fallback
        return [] as RecItem[];
      }
    },
  });
}

export function useFallbackStories(limit = 16) {
  return useQuery({
    queryKey: ['stories', 'fallback', limit],
    queryFn: async () => {
      // Try editor picks from CMS config first
      const configRes = await client.get('/cms');
      const config = configRes.data?.data || configRes.data || {};
      let editorPicks: Story[] = [];
      try {
        editorPicks = JSON.parse(config.editorPicks || '[]');
      } catch {
        editorPicks = [];
      }
      if (editorPicks.length > 0) return editorPicks;

      // Fallback to official stories
      const data = await storyService.getAll({ isOfficial: true, limit });
      return (Array.isArray(data) ? data : (data as { data: Story[] })?.data || []) as Story[];
    },
  });
}
