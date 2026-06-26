import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'readTheme';

function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark');
  } else if (mode === 'light') {
    root.removeAttribute('data-theme');
    root.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.removeAttribute('data-theme');
      root.classList.remove('dark');
    }
  }
}

function loadInitialTheme(): ThemeMode {
  return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'auto';
}

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: loadInitialTheme(),
  setThemeMode: (mode: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
    set({ themeMode: mode });
  },
}));

// Apply initial theme on load
applyTheme(loadInitialTheme());

// Listen for system preference changes in auto mode
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { themeMode } = useThemeStore.getState();
    if (themeMode === 'auto') {
      applyTheme('auto');
    }
  });
}
