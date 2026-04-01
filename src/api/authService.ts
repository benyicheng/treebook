import client from './client';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'reader' | 'author' | 'admin' | 'editor';
  permissions: string[];
}

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const { data } = await client.post<{ user: User; token: string }>('/auth/login', credentials);
    localStorage.setItem('token', data.token);
    return data;
  },

  register: async (userData: any) => {
    const { data } = await client.post<{ user: User; token: string }>('/auth/register', userData);
    localStorage.setItem('token', data.token);
    return data;
  },

  getMe: async () => {
    const { data } = await client.get<User>('/auth/me');
    return data;
  },

  updateMe: async (payload: { username?: string; avatarUrl?: string; profile?: any }) => {
    const { data } = await client.put<User>('/auth/me', payload);
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },
};
