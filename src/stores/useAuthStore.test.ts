import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';
import { authService } from '../api/authService';

vi.mock('../api/authService');

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
    vi.clearAllMocks();
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
    } catch (_) {
      // login re-throws after setting state
    }

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().error).toBe(errorMessage);
  });

  it('checkAuth restores session if token exists', async () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'test', role: 'reader', permissions: [] };
    localStorage.setItem('token', 'valid-token');
    (authService.getMe as any).mockResolvedValue(mockUser);

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('checkAuth clears session if token is invalid', async () => {
    localStorage.setItem('token', 'invalid-token');
    (authService.getMe as any).mockRejectedValue(new Error('Unauthorized'));

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('checkAuth does nothing if no token exists', async () => {
    localStorage.removeItem('token');

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(authService.getMe).not.toHaveBeenCalled();
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
