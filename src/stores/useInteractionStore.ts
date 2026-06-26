import { create } from 'zustand';

type InteractionCallback = (targetType: string, targetId: string) => void;

interface InteractionState {
  loginPromptVisible: boolean;
  showLoginPrompt: () => void;
  hideLoginPrompt: () => void;
  _interactionSubscribers: Set<InteractionCallback>;
  onInteractionUpdate: (cb: InteractionCallback) => () => void;
  emitInteractionUpdate: (targetType: string, targetId: string) => void;
}

export const useInteractionStore = create<InteractionState>((set, get) => ({
  loginPromptVisible: false,

  showLoginPrompt: () => {
    set({ loginPromptVisible: true });
  },

  hideLoginPrompt: () => {
    set({ loginPromptVisible: false });
  },

  _interactionSubscribers: new Set(),

  onInteractionUpdate: (cb: InteractionCallback) => {
    get()._interactionSubscribers.add(cb);
    return () => {
      get()._interactionSubscribers.delete(cb);
    };
  },

  emitInteractionUpdate: (targetType: string, targetId: string) => {
    get()._interactionSubscribers.forEach((cb) => cb(targetType, targetId));
  },
}));
