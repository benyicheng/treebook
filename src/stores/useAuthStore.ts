import { create } from 'zustand';
import { authService, User } from '../api/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  updateMe: (payload: { username?: string; avatarUrl?: string; profile?: any }) => Promise<void>;
}

/** Clear all auth state (used by checkAuth failure & auth:logout event) */
function clearAuth(set: (partial: Partial<AuthState>) => void) {
  set({ user: null, token: null, isAuthenticated: false, isLoading: false });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  hasPermission: (permission: string) => {
    const user = get().user;
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) || false;
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await authService.login(credentials);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error?.message || err.message, isLoading: false });
      throw err;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await authService.register(userData);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error?.message || err.message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    authService.logout();
    clearAuth(set);
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    set({ isLoading: true, token });
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      clearAuth(set);
    }
  },

  updateMe: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.updateMe(payload);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  },
}));

// Listen for forced logout from the API client (when auto-refresh fails)
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    clearAuth(useAuthStore.setState);
  });
}
