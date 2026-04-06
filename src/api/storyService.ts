import client from './client';

export interface Story {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  authorId: string;
  status: 'ongoing' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
  author?: {
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

export interface Tag {
  id: string;
  name: string;
  _count?: {
    stories: number;
  };
}

export interface Branch {
  id: string;
  parentStoryId: string;
  parentChapterId: string;
  authorId: string;
  title: string;
  description: string;
  branchType: string;
  isOfficial: boolean;
  isCertified?: boolean;
  status?: 'ongoing' | 'completed' | 'merged';
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
  author?: {
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
    username: string;
  };
  originalStory?: {
    title: string;
    authorId: string;
  };
  originalBranch?: {
    title: string;
    description?: string;
  };
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
    return data.data || data;
  },

  getMy: async () => {
    const { data } = await client.get<any>('/stories/my');
    return data.data || data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<any>(`/stories/${id}`);
    return data.data || data;
  },

  create: async (storyData: Partial<Story>) => {
    const { data } = await client.post<any>('/stories', storyData);
    return data.data || data;
  },

  update: async (id: string, storyData: Partial<Story>) => {
    const { data } = await client.put<any>(`/stories/${id}`, storyData);
    return data.data || data;
  },

  getAll: async (params?: { tag?: string; isOfficial?: boolean; q?: string }) => {
    const { data } = await client.get<any>('/stories', { params });
    return data.data || data;
  },

  getRecentReads: async () => {
    const { data } = await client.get<any>('/stories/recent');
    return data.data || data;
  },

  getCharacters: async (storyId: string) => {
    const { data } = await client.get<any>(`/stories/${storyId}/characters`);
    return data.data || data;
  },

  createCharacter: async (storyId: string, charData: Partial<Character>) => {
    const { data } = await client.post<any>(`/stories/${storyId}/characters`, charData);
    return data.data || data;
  },

  updateCharacter: async (charId: string, charData: Partial<Character>) => {
    const { data } = await client.put<any>(`/stories/characters/${charId}`, charData);
    return data.data || data;
  },

  deleteCharacter: async (charId: string) => {
    const { data } = await client.delete(`/stories/characters/${charId}`);
    return data.data || data;
  }
};

export const chapterService = {
  getById: async (id: string, referralId?: string) => {
    const { data } = await client.get<any>(`/chapters/${id}`, {
      params: { referralId }
    });
    return data.data || data;
  },

  create: async (chapterData: Partial<Chapter>) => {
    const { data } = await client.post<any>('/chapters', chapterData);
    return data.data || data;
  },

  update: async (id: string, chapterData: Partial<Chapter>) => {
    const { data } = await client.put<any>(`/chapters/${id}`, chapterData);
    return data.data || data;
  },

  getComments: async (chapterId: string) => {
    const { data } = await client.get<any>(`/chapters/${chapterId}/comments`);
    return data.data || data;
  },

  createComment: async (chapterId: string, content: string) => {
    const { data } = await client.post<any>(`/chapters/${chapterId}/comments`, { content });
    return data.data || data;
  },

  deleteComment: async (commentId: string) => {
    const { data } = await client.delete(`/chapters/comments/${commentId}`);
    return data.data || data;
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
  getAll: async () => {
    const { data } = await client.get<any>('/branches');
    return data.data || data;
  },

  create: async (branchData: Partial<Branch>) => {
    const { data } = await client.post<any>('/branches', branchData);
    return data.data || data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<any>(`/branches/${id}`);
    return data.data || data;
  },

  getMy: async () => {
    const { data } = await client.get<any>('/branches/my');
    return data.data || data;
  },

  update: async (id: string, branchData: Partial<Branch>) => {
    const { data } = await client.put<any>(`/branches/${id}`, branchData);
    return data.data || data;
  },

  delete: async (id: string) => {
    const { data } = await client.delete(`/branches/${id}`);
    return data.data || data;
  },

  certify: async (id: string, isCertified: boolean) => {
    const { data } = await client.post<any>(`/branches/${id}/certify`, { isCertified });
    return data.data || data;
  },
};

export interface ReadingSavepoint {
  id: string;
  userId: string;
  storyId: string;
  branchId?: string;
  chapterId: string;
  name?: string;
  createdAt: string;
  chapter?: { title: string; orderIndex: number };
  branch?: { title: string };
  story?: { title: string };
}

export const savepointService = {
  create: async (savepointData: { storyId: string, branchId?: string, chapterId: string, name?: string }) => {
    const { data } = await client.post<any>('/savepoints', savepointData);
    return data.data || data;
  },

  getAll: async (params?: { storyId?: string }) => {
    const { data } = await client.get<any>('/savepoints', { params });
    return data.data || data;
  },

  delete: async (id: string) => {
    const { data } = await client.delete(`/savepoints/${id}`);
    return data.data || data;
  }
};

export const spinoffService = {
  getAll: async (params?: { originalStoryId?: string; isOfficial?: boolean }) => {
    const { data } = await client.get<any>('/spinoffs', { params });
    return data.data || data;
  },
  
  getById: async (id: string) => {
    const { data } = await client.get<any>(`/spinoffs/${id}`);
    return data.data || data;
  },

  getMy: async () => {
    const { data } = await client.get<any>('/spinoffs/my');
    return data.data || data;
  },

  create: async (spinoffData: Partial<Spinoff>) => {
    const { data } = await client.post<any>('/spinoffs', spinoffData);
    return data.data || data;
  },

  update: async (id: string, spinoffData: Partial<Spinoff>) => {
    const { data } = await client.put<any>(`/spinoffs/${id}`, spinoffData);
    return data.data || data;
  },

  delete: async (id: string) => {
    const { data } = await client.delete(`/spinoffs/${id}`);
    return data.data || data;
  }
};

export const booklistService = {
  getAll: async (params?: { creatorId?: string; isPublic?: boolean; limit?: number; type?: string; tag?: string; sortBy?: string }) => {
    const { data } = await client.get<any>('/booklists', { params });
    return data.data || data;
  },

  getMy: async () => {
    const { data } = await client.get<any>('/booklists/my');
    return data.data || data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<any>(`/booklists/${id}`);
    return data.data || data;
  },

  create: async (booklistData: Partial<Booklist>) => {
    const { data } = await client.post<any>('/booklists', booklistData);
    return data.data || data;
  },

  update: async (id: string, booklistData: Partial<Booklist>) => {
    const { data } = await client.put<any>(`/booklists/${id}`, booklistData);
    return data.data || data;
  },

  delete: async (id: string) => {
    const { data } = await client.delete(`/booklists/${id}`);
    return data.data || data;
  },

  addItem: async (booklistId: string, itemData: { chapterId: string, notes?: string }) => {
    const { data } = await client.post<any>(`/booklists/${booklistId}/items`, itemData);
    return data.data || data;
  },

  updateItem: async (booklistId: string, itemId: string, itemData: { notes?: string, orderIndex?: number }) => {
    const { data } = await client.put<any>(`/booklists/${booklistId}/items/${itemId}`, itemData);
    return data.data || data;
  },

  removeItem: async (booklistId: string, itemId: string) => {
    const { data } = await client.delete(`/booklists/${booklistId}/items/${itemId}`);
    return data.data || data;
  },

  reorderItems: async (booklistId: string, itemOrders: { id: string, orderIndex: number }[]) => {
    const { data } = await client.patch<any>(`/booklists/${booklistId}/reorder`, { itemOrders });
    return data.data || data;
  }
};

export const aiService = {
  generateImage: async (prompt: string, options?: any) => {
    const { data } = await client.post<any>('/ai/image', { prompt, options });
    return data.data || data;
  },
  
  generateVideo: async (prompt: string, options?: any) => {
    const { data } = await client.post<any>('/ai/video', { prompt, options });
    return data.data || data;
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
