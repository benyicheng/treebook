import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';
import { authService } from '../api/authService';
import client from '../api/client';

/**
 * useAuthStore 现在读内存 tokenStore + httpOnly cookie refresh：
 *   - checkAuth 若 getToken() 为空，会先 POST /auth/refresh 尝试恢复会话
 *   - token 不再写入 localStorage
 *
 * 历史 localStorage 版本的断言已不再适用，整体重写。
 */

vi.mock('../api/authService');
vi.mock('../api/client', () => ({
  default: {
    post: vi.fn(),
  },
}));

// 让 tokenStore 受控：checkAuth 通过 getToken() 决定是否走 refresh
vi.mock('../lib/tokenStore', () => {
  let current: string | null = null;
  return {
    getToken: () => current,
    setToken: (t: string | null) => { current = t; },
    clearToken: () => { current = null; },
    __reset: () => { current = null; },
  };
});

describe('useAuthStore', () => {
  beforeEach(async () => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
    vi.clearAllMocks();
    const tokenStore: any = await import('../lib/tokenStore');
    tokenStore.__reset?.();
  });

  it('login updates state on success', async () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'test', role: 'reader', permissions: [] };
    (authService.login as any).mockResolvedValue({ user: mockUser, token: 'token-1' });

    await useAuthStore.getState().login({ email: 'test@example.com', password: 'password' });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('login updates error state on failure', async () => {
    const errorMessage = 'Invalid credentials';
    (authService.login as any).mockRejectedValue({ message: errorMessage });

    try {
      await useAuthStore.getState().login({ email: 'test@example.com', password: 'wrong' });
    } catch {
      // login re-throws after setting state
    }

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().error).toBe(errorMessage);
  });

  it('checkAuth restores session via refresh cookie when no in-memory token', async () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'test', role: 'reader', permissions: [] };
    (client.post as any).mockResolvedValue({ data: { token: 'restored-token' } });
    (authService.getMe as any).mockResolvedValue(mockUser);

    await useAuthStore.getState().checkAuth();

    expect(client.post).toHaveBeenCalledWith('/auth/refresh', {});
    expect(authService.getMe).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('checkAuth clears session if refresh fails (no cookie)', async () => {
    (client.post as any).mockRejectedValue(new Error('Unauthorized'));

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(authService.getMe).not.toHaveBeenCalled();
  });

  it('checkAuth clears session if getMe fails after refresh', async () => {
    (client.post as any).mockResolvedValue({ data: { token: 'restored-token' } });
    (authService.getMe as any).mockRejectedValue(new Error('Unauthorized'));

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('updateMe updates user on success', async () => {
    const updatedUser = { id: '1', email: 'test@example.com', username: 'new', role: 'reader', permissions: [] };
    (authService.updateMe as any).mockResolvedValue(updatedUser);

    await useAuthStore.getState().updateMe({ username: 'new' });

    expect(useAuthStore.getState().user).toEqual(updatedUser);
    expect(useAuthStore.getState().error).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('updateMe sets error on failure', async () => {
    (authService.updateMe as any).mockRejectedValue({ message: 'Conflict' });

    await useAuthStore.getState().updateMe({ username: 'taken' });

    expect(useAuthStore.getState().error).toBe('Conflict');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
