import client from './client';

export interface Booklist {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  content?: string;
  coverImage?: string;
  type?: string;
  isPublic: boolean;
  viewCount?: number;
  likesCount?: number;
  totalEarnings?: number;
  tags?: { id: string; name: string }[] | string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    username: string;
  };
  _count?: { items: number };
  items?: any[];
  itemsBySection?: Record<string, any[]>;
  itemsByStory?: { storyId: string; story?: any; items: any[]; events: any[]; children: any[] }[];
  ungroupedItems?: any[];
  paths?: any[];
}

export const booklistService = {
  getAll: async (params?: { creatorId?: string; isPublic?: boolean; limit?: number; type?: string; tag?: string; q?: string; sortBy?: string; page?: number }) => {
    const { data } = await client.get<any>('/booklists', { params });
    return data.items ?? data;
  },

  getMy: async () => {
    const { data } = await client.get<any>('/booklists/my');
    return data.items ?? data;
  },

  getById: async (id: string) => {
    if (!id) throw new Error('booklistService.getById: id is required');
    const { data } = await client.get<any>(`/booklists/${id}`);
    return data;
  },

  create: async (booklistData: Partial<Booklist>) => {
    const { data } = await client.post<any>('/booklists', booklistData);
    return data;
  },

  update: async (id: string, booklistData: Partial<Booklist>) => {
    const { data } = await client.put<any>(`/booklists/${id}`, booklistData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await client.delete(`/booklists/${id}`);
    return data;
  },

  getWikiPages: async (booklistId: string) => {
    const { data } = await client.get<any>(`/booklists/${booklistId}/wiki-pages`);
    return data;
  },

  addItem: async (booklistId: string, itemData: { chapterId?: string, targetType?: string, targetId?: string, notes?: string, section?: string }) => {
    const { data } = await client.post<any>(`/booklists/${booklistId}/items`, itemData);
    return data;
  },

  batchAddItems: async (booklistId: string, payload: { items: { targetType?: string; targetId?: string; chapterId?: string; notes?: string; section?: string }[]; notes?: string }) => {
    const { data } = await client.post<any>(`/booklists/${booklistId}/items/batch`, payload);
    return data;
  },

  reorderItems: async (booklistId: string, items: { id: string; orderIndex: number }[]) => {
    const { data } = await client.put<any>(`/booklists/${booklistId}/items/reorder`, { items });
    return data;
  },

  updateItem: async (booklistId: string, itemId: string, itemData: { notes?: string, orderIndex?: number }) => {
    const { data } = await client.put<any>(`/booklists/${booklistId}/items/${itemId}`, itemData);
    return data;
  },

  removeItem: async (booklistId: string, itemId: string) => {
    const { data } = await client.delete(`/booklists/${booklistId}/items/${itemId}`);
    return data;
  },

  updateProgress: async (booklistId: string, progress: { currentItemIndex?: number; completedItemIds?: string[] }) => {
    const { data } = await client.patch<any>(`/booklists/${booklistId}/progress`, progress);
    return data;
  },

  getProgress: async (booklistId: string) => {
    const { data } = await client.get<any>(`/booklists/${booklistId}/progress`);
    return data;
  },

  // ── Graph: Relations ──
  getGraph: async (booklistId: string) => {
    const { data } = await client.get<any>(`/booklists/${booklistId}/graph`);
    return data;
  },

  createRelation: async (booklistId: string, relationData: {
    sourceItemId: string;
    targetItemId: string;
    relationType: string;
    label?: string | null;
  }) => {
    const { data } = await client.post<any>(`/booklists/${booklistId}/relations`, relationData);
    return data;
  },

  deleteRelation: async (booklistId: string, relationId: string) => {
    const { data } = await client.delete(`/booklists/${booklistId}/relations/${relationId}`);
    return data;
  },

  getStoryLinks: async (booklistId: string) => {
    const { data } = await client.get<any>(`/booklists/${booklistId}/story-links`);
    return data;
  },

  syncStoryLinks: async (booklistId: string) => {
    const { data } = await client.post<any>(`/booklists/${booklistId}/sync-story-links`);
    return data;
  },
};
