import client from './client';

export interface Story {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  authorId: string;
  isOfficial?: boolean;
  status: 'ongoing' | 'completed' | 'paused';
  viewCount?: number;
  branchCount?: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    username: string;
    role: string;
  };
  tags?: { id: string; name: string }[];
  _count?: {
    branches: number;
    chapters: number;
  };
  spinoffs?: Spinoff[];
}

export interface Chapter {
  id: string;
  storyId: string;
  branchId?: string;
  title: string;
  content: string;
  orderIndex: number;
  isBranchPoint: boolean;
  createdAt: string;
}

export interface Branch {
  id: string;
  parentStoryId: string;
  parentChapterId: string;
  parentBranchId?: string;
  authorId: string;
  title: string;
  description: string;
  branchType: string;
  isOfficial: boolean;
  isCertified?: boolean;
  treeDepth?: number;
  status?: 'ongoing' | 'completed' | 'merged';
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    username: string;
    role: string;
  };
  parentStory?: Story & { spinoffs?: Spinoff[] };
  parentChapter?: {
    id: string;
    title: string;
    orderIndex: number;
  };
  _count?: {
    chapters: number;
  };
}

export interface Spinoff {
  id: string;
  authorId: string;
  originalStoryId: string;
  originalBranchId?: string;
  originalChapterId?: string;
  title: string;
  summary?: string;
  content: string;
  type: 'biography' | 'if_timeline' | 'world_expansion';
  status: 'ongoing' | 'completed' | 'merged';
  isOfficial: boolean;
  isCertified?: boolean;
  revenueShareRate: number;
  referencedCharacters?: string; // JSON String
  characterRelationships?: string; // JSON String
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    username: string;
  };
  originalStory?: {
    title: string;
    authorId: string;
    description?: string;
    coverImage?: string;
    status?: string;
    author?: { username: string };
    tags?: { id: string; name: string }[];
  };
  originalBranch?: {
    title: string;
    description?: string;
  };
  originalChapter?: {
    id: string;
    title: string;
    orderIndex: number;
  };
  characters?: Pick<Character, 'id' | 'name' | 'role' | 'avatarUrl'>[];
}

export interface Booklist {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  coverImage?: string;
  type?: 'TIMELINE' | 'COLLECTION';
  tags?: string;
  isPublic: boolean;
  viewCount?: number;
  likesCount?: number;
  totalEarnings?: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    username: string;
  };
  _count?: { items: number };
  items?: any[];
}

export interface Character {
  id: string;
  storyId: string;
  name: string;
  description: string;
  avatarUrl?: string;
  role: 'protagonist' | 'antagonist' | 'supporting';
  attributes?: any;
}

export const storyService = {
  getTags: async () => {
    const { data } = await client.get<any>('/stories/tags');
    return data;
  },

  getMy: async () => {
    const { data } = await client.get<any>('/stories/my');
    return data.items ?? data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<any>(`/stories/${id}`);
    return data;
  },

  create: async (storyData: Partial<Story>) => {
    const { data } = await client.post<any>('/stories', storyData);
    return data;
  },

  update: async (id: string, storyData: Partial<Story>) => {
    const { data } = await client.put<any>(`/stories/${id}`, storyData);
    return data;
  },

  getAll: async (params?: { tag?: string; isOfficial?: boolean; q?: string; page?: number; limit?: number }) => {
    const { data } = await client.get<any>('/stories', { params });
    return data.items ?? data;
  },

  getRecentReads: async () => {
    try {
      const { data } = await client.get<any>('/stories/recent');
      return data;
    } catch {
      return { data: [] };
    }
  },

  getCharacters: async (storyId: string) => {
    const { data } = await client.get<any>(`/stories/${storyId}/characters`);
    return data;
  },

  createCharacter: async (storyId: string, charData: Partial<Character>) => {
    const { data } = await client.post<any>(`/stories/${storyId}/characters`, charData);
    return data;
  },

  updateCharacter: async (charId: string, charData: Partial<Character>) => {
    const { data } = await client.put<any>(`/stories/characters/${charId}`, charData);
    return data;
  },

  deleteCharacter: async (charId: string) => {
    const { data } = await client.delete(`/stories/characters/${charId}`);
    return data;
  },

  getCharacterAppearances: async (storyId: string) => {
    const { data } = await client.get<any>(`/stories/${storyId}/character-appearances`);
    return data;
  },

  batchCharacterAppearances: async (storyId: string, appearances: { characterId: string; targetType: string; targetId: string; appearanceType: string }[]) => {
    const { data } = await client.put<any>(`/stories/${storyId}/character-appearances`, { appearances });
    return data;
  }
};

export const chapterService = {
  search: async (query: string) => {
    const { data } = await client.get<any>('/chapters/search', {
      params: { q: query }
    });
    return data;
  },

  getById: async (id: string, referralId?: string) => {
    const { data } = await client.get<any>(`/chapters/${id}`, {
      params: { referralId }
    });
    return data;
  },

  getByStory: async (storyId: string, branchId?: string, includeBranches?: boolean) => {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    if (includeBranches) params.includeBranches = 'true';
    const { data } = await client.get<any>(`/chapters/stories/${storyId}`, { params });
    return data;
  },

  create: async (chapterData: Partial<Chapter>) => {
    const { data } = await client.post<any>('/chapters', chapterData);
    return data;
  },

  update: async (id: string, chapterData: Partial<Chapter>) => {
    const { data } = await client.put<any>(`/chapters/${id}`, chapterData);
    return data;
  },

  getComments: async (chapterId: string) => {
    const { data } = await client.get<any>(`/chapters/${chapterId}/comments`);
    return data;
  },

  createComment: async (chapterId: string, content: string) => {
    const { data } = await client.post<any>(`/chapters/${chapterId}/comments`, { content });
    return data;
  },

  deleteComment: async (commentId: string) => {
    const { data } = await client.delete(`/chapters/comments/${commentId}`);
    return data;
  }
};

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  chapterId: string;
  createdAt: string;
  author: {
    username: string;
    avatarUrl?: string;
    role: string;
  };
}

export const branchService = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const { data } = await client.get<any>('/branches', { params });
    return data.items ?? data;
  },

  create: async (branchData: Partial<Branch>) => {
    const { data } = await client.post<any>('/branches', branchData);
    return data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<any>(`/branches/${id}`);
    return data;
  },

  getMy: async () => {
    const { data } = await client.get<any>('/branches/my');
    return data.items ?? data;
  },

  update: async (id: string, branchData: Partial<Branch>) => {
    const { data } = await client.put<any>(`/branches/${id}`, branchData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await client.delete(`/branches/${id}`);
    return data;
  },

  certify: async (id: string, isCertified: boolean) => {
    const { data } = await client.post<any>(`/branches/${id}/certify`, { isCertified });
    return data;
  },

  createSubBranch: async (parentBranchId: string, subBranchData: {
    parentChapterId: string;
    title: string;
    description?: string;
    branchType?: string;
  }) => {
    const { data } = await client.post<any>(`/branches/${parentBranchId}/sub-branches`, subBranchData);
    return data;
  },
};

export const savepointService = {
  create: async (savepointData: { storyId: string, branchId?: string, chapterId: string, name?: string }) => {
    const { data } = await client.post<any>('/savepoints', savepointData);
    return data;
  },

  getAll: async (params?: { storyId?: string }) => {
    const { data } = await client.get<any>('/savepoints', { params });
    return data;
  },

  delete: async (id: string) => {
    const { data } = await client.delete(`/savepoints/${id}`);
    return data;
  }
};

export const spinoffService = {
  getAll: async (params?: { originalStoryId?: string; isOfficial?: boolean; page?: number; limit?: number }) => {
    const { data } = await client.get<any>('/spinoffs', { params });
    return data.items ?? data;
  },
  
  getById: async (id: string) => {
    const { data } = await client.get<any>(`/spinoffs/${id}`);
    return data;
  },

  getMy: async () => {
    const { data } = await client.get<any>('/spinoffs/my');
    return data.items ?? data;
  },

  create: async (spinoffData: Partial<Spinoff>) => {
    const { data } = await client.post<any>('/spinoffs', spinoffData);
    return data;
  },

  update: async (id: string, spinoffData: Partial<Spinoff>) => {
    const { data } = await client.put<any>(`/spinoffs/${id}`, spinoffData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await client.delete(`/spinoffs/${id}`);
    return data;
  }
};

export const booklistService = {
  getAll: async (params?: { creatorId?: string; isPublic?: boolean; limit?: number; type?: string; tag?: string; sortBy?: string; page?: number }) => {
    const { data } = await client.get<any>('/booklists', { params });
    return data.items ?? data;
  },

  getMy: async () => {
    const { data } = await client.get<any>('/booklists/my');
    return data.items ?? data;
  },

  getById: async (id: string) => {
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

  addItem: async (booklistId: string, itemData: { chapterId: string, notes?: string }) => {
    const { data } = await client.post<any>(`/booklists/${booklistId}/items`, itemData);
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

  reorderItems: async (booklistId: string, itemOrders: { id: string, orderIndex: number }[]) => {
    const { data } = await client.patch<any>(`/booklists/${booklistId}/reorder`, { itemOrders });
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

  toggleProgress: async (booklistId: string, itemId: string) => {
    const { data } = await client.post<any>(`/booklists/${booklistId}/progress/toggle`, { itemId });
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

export const aiService = {
  generateImage: async (prompt: string, options?: any) => {
    const { data } = await client.post<any>('/ai/image', { prompt, options });
    return data;
  },
  
  generateVideo: async (prompt: string, options?: any) => {
    const { data } = await client.post<any>('/ai/video', { prompt, options });
    return data;
  }
};

// Re-export interaction service for convenience
export { interactionService } from './interactionService';
export type { 
  InteractionStats, 
  LikeResponse, 
  ShareResponse, 
  RatingRequest,
  ShareConfig 
} from './interactionService';
