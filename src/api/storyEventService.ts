import client from './client';

export interface StoryEvent {
  id: string;
  storyId: string;
  title: string;
  description?: string;
  type: string;
  importance: number;
  color?: string;
  sortOrder: number;
  /** 故事内编年时间序号（in-universe 编年史）。null 表示未标注，UI 退化到 sortOrder 排序 */
  storyTime?: number | null;
  nodes: StoryEventNode[];
  createdAt: string;
  updatedAt: string;
}

export interface StoryEventNode {
  id: string;
  eventId: string;
  targetType: 'chapter' | 'branch' | 'spinoff';
  targetId: string;
  sortOrder: number;
  note?: string;
}

export interface EventComment {
  id: string;
  content: string;
  authorId: string;
  eventId: string;
  createdAt: string;
  author: {
    username: string;
    avatarUrl?: string;
    role: string;
  };
}

export const storyEventService = {
  async search(query: string) {
    const { data } = await client.get<StoryEvent[]>('/events', { params: { q: query } });
    return data;
  },

  async getByStory(storyId: string) {
    const { data } = await client.get<StoryEvent[]>(`/events/story/${storyId}`);
    return data;
  },

  async getById(id: string) {
    const { data } = await client.get<StoryEvent>(`/events/${id}`);
    return data;
  },

  async create(input: {
    storyId: string;
    title: string;
    description?: string;
    type?: string;
    importance?: number;
    color?: string;
    sortOrder?: number;
    nodes?: { targetType: string; targetId: string; sortOrder?: number; note?: string }[];
  }) {
    const { data } = await client.post<StoryEvent>('/events', input);
    return data;
  },

  async update(id: string, input: Partial<StoryEvent>) {
    const { data } = await client.put<StoryEvent>(`/events/${id}`, input);
    return data;
  },

  async delete(id: string) {
    const { data } = await client.delete(`/events/${id}`);
    return data;
  },

  async addNode(eventId: string, input: { targetType: string; targetId: string; sortOrder?: number; note?: string }) {
    const { data } = await client.post(`/events/${eventId}/nodes`, input);
    return data;
  },

  async removeNode(eventId: string, nodeId: string) {
    const { data } = await client.delete(`/events/${eventId}/nodes/${nodeId}`);
    return data;
  },

  async reorderNodes(eventId: string, nodeIds: string[]) {
    const { data } = await client.put(`/events/${eventId}/nodes/reorder`, { nodeIds });
    return data;
  },

  // ── Comments ──
  async getComments(eventId: string) {
    const { data } = await client.get<EventComment[]>(`/events/${eventId}/comments`);
    return data;
  },

  async createComment(eventId: string, content: string) {
    const { data } = await client.post<EventComment>(`/events/${eventId}/comments`, { content });
    return data;
  },

  async deleteComment(eventId: string, commentId: string) {
    const { data } = await client.delete(`/events/${eventId}/comments/${commentId}`);
    return data;
  },
};
