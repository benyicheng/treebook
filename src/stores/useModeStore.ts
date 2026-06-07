import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Mode = 'browse' | 'create';

interface ModeState {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      mode: 'browse',
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((state) => ({ mode: state.mode === 'browse' ? 'create' : 'browse' })),
    }),
    {
      name: 'mode-storage',
    }
  )
);
