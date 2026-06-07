// Centralized query keys for @tanstack/react-query
// Organised by domain. Use factories to ensure consistent key structure.

export const queryKeys = {
  stories: {
    all: ['stories'] as const,
    lists: () => [...queryKeys.stories.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.stories.lists(), params ?? {}] as const,
    detail: (id: string) => [...queryKeys.stories.all, 'detail', id] as const,
    my: ['stories', 'my'] as const,
    recent: ['stories', 'recent'] as const,
    tags: ['stories', 'tags'] as const,
  },

  chapters: {
    all: ['chapters'] as const,
    detail: (id: string) => ['chapters', 'detail', id] as const,
    byStory: (storyId: string, branchId?: string) =>
      ['chapters', 'byStory', storyId, branchId ?? 'main'] as const,
    comments: (chapterId: string) => ['chapters', 'comments', chapterId] as const,
  },

  branches: {
    all: ['branches'] as const,
    lists: () => [...queryKeys.branches.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.branches.lists(), params ?? {}] as const,
    detail: (id: string) => [...queryKeys.branches.all, 'detail', id] as const,
    my: ['branches', 'my'] as const,
  },

  spinoffs: {
    all: ['spinoffs'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.spinoffs.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.spinoffs.all, 'detail', id] as const,
    my: ['spinoffs', 'my'] as const,
  },

  booklists: {
    all: ['booklists'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.booklists.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.booklists.all, 'detail', id] as const,
    my: ['booklists', 'my'] as const,
  },

  characters: {
    all: ['characters'] as const,
    byStory: (storyId: string) => ['characters', 'byStory', storyId] as const,
  },

  characterAppearances: {
    all: ['characterAppearances'] as const,
    byStory: (storyId: string) => ['characterAppearances', 'byStory', storyId] as const,
  },

  search: {
    all: ['search'] as const,
    results: (query: string, type?: string | null, limit?: number, offset?: number, sort?: string) =>
      ['search', 'results', query, type ?? 'all', limit ?? 20, offset ?? 0, sort ?? 'relevance'] as const,
  },

  follow: {
    all: ['follow'] as const,
    status: (targetUserId: string) => ['follow', 'status', targetUserId] as const,
    followers: (userId: string) => ['follow', 'followers', userId] as const,
    following: (userId: string) => ['follow', 'following', userId] as const,
    activity: ['follow', 'activity'] as const,
    activityMore: (cursor?: string) =>
      ['follow', 'activity', cursor ?? ''] as const,
  },

  discover: {
    all: ['discover'] as const,
    feed: (params?: Record<string, unknown>) =>
      [...queryKeys.discover.all, 'feed', params ?? {}] as const,
  },

  editorial: {
    picks: ['editorial', 'picks'] as const,
    curated: (section?: string) => ['editorial', 'curated', section ?? 'default'] as const,
  },

  recommendations: {
    forYou: ['recommendations', 'forYou'] as const,
  },

  notifications: {
    list: ['notifications', 'list'] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
  },

  users: {
    popular: ['users', 'popular'] as const,
    newest: ['users', 'newest'] as const,
    profile: (id: string) => ['users', 'profile', id] as const,
  },

  subBranches: {
    byBranch: (branchId: string) => ['branches', branchId, 'subBranches'] as const,
  },

  wiki: {
    all: ['wiki'] as const,
    lists: () => [...queryKeys.wiki.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.wiki.lists(), params ?? {}] as const,
    detail: (id: string) => [...queryKeys.wiki.all, 'detail', id] as const,
  },

  cms: {
    config: ['cms', 'config'] as const,
  },

  readingProgress: {
    all: ['readingProgress'] as const,
    progress: (chapterIds?: string[]) =>
      ['readingProgress', 'progress', chapterIds ?? 'all'] as const,
    stats: ['readingProgress', 'stats'] as const,
  },
} as const;
