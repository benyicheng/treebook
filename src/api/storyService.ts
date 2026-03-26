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
  title: string;
  content: string;
  isOfficial: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    username: string;
  };
  originalStory?: {
    title: string;
  };
}

export interface Booklist {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  isPublic: boolean;
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
    const { data } = await client.get<Tag[]>('/stories/tags');
    return data;
  },

  getMy: async () => {
    const { data } = await client.get<Story[]>('/stories/my');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<Story & { chapters: Chapter[], branches: Branch[] }>(`/stories/${id}`);
    return data;
  },

  create: async (storyData: Partial<Story>) => {
    const { data } = await client.post<Story>('/stories', storyData);
    return data;
  },

  update: async (id: string, storyData: Partial<Story>) => {
    const { data } = await client.put<Story>(`/stories/${id}`, storyData);
    return data;
  },

  getAll: async (params?: { tag?: string; isOfficial?: boolean }) => {
    const { data } = await client.get<Story[]>('/stories', { params });
    return data;
  },

  getRecentReads: async () => {
    const { data } = await client.get<any[]>('/stories/recent');
    return data;
  },

  getCharacters: async (storyId: string) => {
    const { data } = await client.get<Character[]>(`/stories/${storyId}/characters`);
    return data;
  },

  createCharacter: async (storyId: string, charData: Partial<Character>) => {
    const { data } = await client.post<Character>(`/stories/${storyId}/characters`, charData);
    return data;
  },

  updateCharacter: async (charId: string, charData: Partial<Character>) => {
    const { data } = await client.put<Character>(`/stories/characters/${charId}`, charData);
    return data;
  },

  deleteCharacter: async (charId: string) => {
    const { data } = await client.delete(`/stories/characters/${charId}`);
    return data;
  }
};

export const chapterService = {
  getById: async (id: string) => {
    const { data } = await client.get<Chapter & { 
      story: any; 
      branch: any; 
      branchesFrom: Branch[];
      nextChapter: { id: string, title: string } | null;
      prevChapter: { id: string, title: string } | null;
    }>(`/chapters/${id}`);
    return data;
  },

  create: async (chapterData: Partial<Chapter>) => {
    const { data } = await client.post<Chapter>('/chapters', chapterData);
    return data;
  },

  update: async (id: string, chapterData: Partial<Chapter>) => {
    const { data } = await client.put<Chapter>(`/chapters/${id}`, chapterData);
    return data;
  },

  getComments: async (chapterId: string) => {
    const { data } = await client.get<Comment[]>(`/chapters/${chapterId}/comments`);
    return data;
  },

  createComment: async (chapterId: string, content: string) => {
    const { data } = await client.post<Comment>(`/chapters/${chapterId}/comments`, { content });
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
  getAll: async () => {
    const { data } = await client.get<Branch[]>('/branches');
    return data;
  },

  create: async (branchData: Partial<Branch>) => {
    const { data } = await client.post<Branch>('/branches', branchData);
    return data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<Branch & { chapters: Chapter[], parentStory: Story }>(`/branches/${id}`);
    return data;
  },

  getMy: async () => {
    const { data } = await client.get<Branch[]>('/branches/my');
    return data;
  },

  update: async (id: string, branchData: Partial<Branch>) => {
    const { data } = await client.put<Branch>(`/branches/${id}`, branchData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await client.delete(`/branches/${id}`);
    return data;
  },
};

export const spinoffService = {
  getAll: async () => {
    const { data } = await client.get<Spinoff[]>('/spinoffs');
    return data;
  },
  
  getById: async (id: string) => {
    const { data } = await client.get<Spinoff>(`/spinoffs/${id}`);
    return data;
  },

  getMy: async () => {
    const { data } = await client.get<Spinoff[]>('/spinoffs/my');
    return data;
  },

  create: async (spinoffData: Partial<Spinoff>) => {
    const { data } = await client.post<Spinoff>('/spinoffs', spinoffData);
    return data;
  }
};

export const booklistService = {
  getAll: async () => {
    const { data } = await client.get<Booklist[]>('/booklists');
    return data;
  },

  getMy: async () => {
    const { data } = await client.get<Booklist[]>('/booklists/my');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<Booklist & { creator: any, items: any[] }>(`/booklists/${id}`);
    return data;
  },

  create: async (booklistData: Partial<Booklist>) => {
    const { data } = await client.post<Booklist>('/booklists', booklistData);
    return data;
  },

  update: async (id: string, booklistData: Partial<Booklist>) => {
    const { data } = await client.put<Booklist>(`/booklists/${id}`, booklistData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await client.delete(`/booklists/${id}`);
    return data;
  },

  addItem: async (booklistId: string, itemData: { chapterId: string, notes?: string }) => {
    const { data } = await client.post(`/booklists/${booklistId}/items`, itemData);
    return data;
  },

  updateItem: async (booklistId: string, itemId: string, itemData: { notes?: string, orderIndex?: number }) => {
    const { data } = await client.put(`/booklists/${booklistId}/items/${itemId}`, itemData);
    return data;
  },

  removeItem: async (booklistId: string, itemId: string) => {
    const { data } = await client.delete(`/booklists/${booklistId}/items/${itemId}`);
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
