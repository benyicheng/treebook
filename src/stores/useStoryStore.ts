import { create } from 'zustand';
import { storyService, branchService, Story, Chapter, Branch } from '../api/storyService';

interface StoryState {
  stories: Story[];
  myStories: Story[];
  currentStory: (Story & { chapters: Chapter[]; branches: Branch[] }) | null;
  currentBranch: (Branch & { chapters: Chapter[]; parentStory: Story }) | null;
  isLoading: boolean;
  error: string | null;
  fetchStories: (params?: { tag?: string; isOfficial?: boolean }) => Promise<void>;
  fetchStoryById: (id: string) => Promise<void>;
  fetchBranchById: (id: string) => Promise<void>;
  createStory: (storyData: any) => Promise<Story>;
  fetchMyStories: () => Promise<void>;
}

export const useStoryStore = create<StoryState>((set) => ({
  stories: [],
  myStories: [],
  currentStory: null,
  currentBranch: null,
  isLoading: false,
  error: null,

  fetchStories: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const stories = await storyService.getAll(params);
      set({ stories, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch stories', isLoading: false });
    }
  },

  fetchStoryById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const story = await storyService.getById(id);
      set({ currentStory: story, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchBranchById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const branch = await branchService.getById(id);
      set({ currentBranch: branch as any, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createStory: async (storyData: Partial<Story>) => {
    set({ isLoading: true, error: null });
    try {
      const story = await storyService.create(storyData);
      set((state) => ({ stories: [story, ...state.stories], isLoading: false }));
      return story;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  fetchMyStories: async () => {
    set({ isLoading: true, error: null });
    try {
      const myStories = await storyService.getMy();
      set({ myStories, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));
