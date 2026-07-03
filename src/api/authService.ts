import client from './client';
import { setToken, clearToken } from '../lib/tokenStore';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  role: 'reader' | 'author' | 'editor' | 'admin' | 'moderator';
  permissions: string[];
  followerCount?: number;
  followingCount?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  getPublicProfile: async (userId: string) => {
    const { data } = await client.get<any>(`/auth/profile/${userId}`);
    return data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const { data } = await client.post<AuthResponse>('/auth/login', credentials);
    setToken(data.token);
    return data;
  },

  register: async (userData: { username: string; email: string; password: string }) => {
    const { data } = await client.post<AuthResponse>('/auth/register', userData);
    setToken(data.token);
    return data;
  },

  getMe: async () => {
    const { data } = await client.get<User>('/auth/me');
    return data;
  },

  updateMe: async (payload: { username?: string; avatarUrl?: string; profile?: Record<string, unknown> }) => {
    const { data } = await client.put<User>('/auth/me', payload);
    return data;
  },

  logout: async () => {
    client.post('/auth/logout').catch(() => {});
    clearToken();
  },
};
