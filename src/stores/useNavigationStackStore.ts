import { create } from 'zustand';
import type { BooklistItem } from '../api/types';

const STORAGE_KEY = 'nav-stack';

export interface NavigationEntry {
  path: string;
  title: string;
  scrollPosition?: number;
}

function loadStack(): NavigationEntry[] {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // corrupted data
  }
  return [];
}

function persistStack(stack: NavigationEntry[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
  } catch {
    // storage full
  }
}

export interface NavigationStackStore {
  stack: NavigationEntry[];
  isDrawerOpen: boolean;
  currentReadingId: string | null;
  currentBooklistId: string | null;
  currentIndex: number;
  booklistItems: BooklistItem[];

  push: (entry: NavigationEntry) => void;
  pop: () => NavigationEntry | undefined;
  peek: () => NavigationEntry | undefined;
  updateCurrent: (updates: Partial<NavigationEntry>) => void;
  clear: () => void;
  openDrawer: (entry: NavigationEntry, options?: { booklistId?: string; initialIndex?: number; items?: BooklistItem[] }) => void;
  closeDrawer: () => void;
  setCurrentIndex: (index: number) => void;
  setCurrentReadingId: (id: string) => void;
}

export const useNavigationStackStore = create<NavigationStackStore>((set, get) => ({
  stack: loadStack(),
  isDrawerOpen: false,
  currentReadingId: null,
  currentBooklistId: null,
  currentIndex: 0,
  booklistItems: [],

  push: (entry) => {
    set((state) => {
      const newStack = [...state.stack, entry];
      persistStack(newStack);
      return { stack: newStack };
    });
  },

  pop: () => {
    const { stack } = get();
    if (stack.length === 0) return undefined;
    const popped = stack[stack.length - 1];
    const newStack = stack.slice(0, -1);
    persistStack(newStack);
    set({ stack: newStack });
    return popped;
  },

  peek: () => {
    const { stack } = get();
    return stack.length > 0 ? stack[stack.length - 1] : undefined;
  },

  updateCurrent: (updates) => {
    set((state) => {
      if (state.stack.length === 0) return state;
      const newStack = state.stack.map((entry, i) =>
        i === state.stack.length - 1 ? { ...entry, ...updates } : entry,
      );
      persistStack(newStack);
      return { stack: newStack };
    });
  },

  clear: () => {
    persistStack([]);
    set({ stack: [] });
  },

  openDrawer: (entry, options) => {
    const { stack } = get();
    const newStack = [...stack, entry];
    persistStack(newStack);
    set({
      stack: newStack,
      isDrawerOpen: true,
      currentReadingId: entry.path.replace('/read/', ''),
      currentBooklistId: options?.booklistId ?? null,
      currentIndex: options?.initialIndex ?? 0,
      booklistItems: options?.items ?? [],
    });
  },

  closeDrawer: () => {
    const { stack } = get();
    const newStack = stack.slice(0, -1);
    persistStack(newStack);
    set({
      stack: newStack,
      isDrawerOpen: false,
      currentReadingId: null,
      currentBooklistId: null,
      currentIndex: 0,
      booklistItems: [],
    });
  },

  setCurrentIndex: (index) => set({ currentIndex: index }),
  setCurrentReadingId: (id) => set({ currentReadingId: id }),
}));
