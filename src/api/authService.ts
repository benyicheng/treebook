import client from './client';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  role: 'reader' | 'author' | 'admin' | 'editor';
  permissions: string[];
  followerCount?: number;
  followingCount?: number;
}

export interface PublicProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  role: string;
  followerCount: number;
  followingCount: number;
  storyCount: number;
  branchCount: number;
  spinoffCount: number;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RefreshResponse {
  token: string;
  refreshToken: string;
}

export const authService = {
  getPublicProfile: async (userId: string) => {
    const { data } = await client.get<PublicProfile>(`/auth/profile/${userId}`);
    return data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const { data } = await client.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  },

  register: async (userData: any) => {
    const { data } = await client.post<AuthResponse>('/auth/register', userData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
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

  /** Exchange a refresh token for a new access + refresh token pair */
  refreshToken: async (refreshToken: string) => {
    const { data } = await client.post<RefreshResponse>('/auth/refresh', {
      refreshToken,
    });
    return data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      // Best-effort: revoke the refresh token on the server
      client.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },
};
