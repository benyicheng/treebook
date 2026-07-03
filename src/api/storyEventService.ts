import client from './client';
import type { StoryEvent, StoryEventNode, EventComment } from './types';
export type { StoryEvent, StoryEventNode, EventComment };

export const storyEventService = {
  getByStory: async (storyId: string) => {
    const { data } = await client.get<any>(`/events/story/${storyId}`);
    return data;
  },

  /** 按关键词搜索事件（供添加到书单 / 关联节点用） */
  search: async (q: string) => {
    const { data } = await client.get<any>('/events', { params: { q } });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<any>(`/events/${id}`);
    return data;
  },

  create: async (payload: Partial<StoryEvent>) => {
    const { data } = await client.post<any>('/events', payload);
    return data;
  },

  update: async (id: string, payload: Partial<StoryEvent>) => {
    const { data } = await client.put<any>(`/events/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    await client.delete(`/events/${id}`);
  },

  addNode: async (eventId: string, nodePayload: Partial<StoryEventNode>) => {
    const { data } = await client.post<any>(`/events/${eventId}/nodes`, nodePayload);
    return data;
  },

  removeNode: async (eventId: string, nodeId: string) => {
    await client.delete(`/events/${eventId}/nodes/${nodeId}`);
  },

  reorderNodes: async (eventId: string, nodeIds: string[]) => {
    const { data } = await client.put<any>(`/events/${eventId}/nodes/reorder`, { nodeIds });
    return data;
  },

  // ── 评论 ──
  getComments: async (eventId: string): Promise<EventComment[]> => {
    const { data } = await client.get<EventComment[]>(`/events/${eventId}/comments`);
    return data;
  },

  createComment: async (eventId: string, content: string) => {
    const { data } = await client.post<any>(`/events/${eventId}/comments`, { content });
    return data;
  },

  deleteComment: async (eventId: string, commentId: string) => {
    await client.delete(`/events/${eventId}/comments/${commentId}`);
  },
};
