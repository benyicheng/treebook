export interface Character {
  id: string;
  storyId: string;
  name: string;
  description?: string | null;
  avatarUrl?: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'extra';
  attributes?: Record<string, unknown>;
}

export interface Spinoff {
  id: string;
  authorId: string;
  originalStoryId: string;
  originalBranchId?: string;
  originalChapterId?: string;
  originalEventId?: string | null;
  title: string;
  summary?: string;
  content: string;
  type: 'biography' | 'if_timeline' | 'world_expansion';
  status: 'ongoing' | 'completed' | 'merged';
  isOfficial: boolean;
  revenueShareRate: number;
  referencedCharacters?: string;
  characterRelationships?: string;
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
    tags?: { id: string; name: string }[] | string;
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

export interface Story {
  id: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  authorId: string;
  isOfficial?: boolean;
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled' | 'paused';
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
