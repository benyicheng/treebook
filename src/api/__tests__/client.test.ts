import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * 这些测试针对当前的 client.ts 实现：
 *   - access token 通过内存 tokenStore 读写（非 localStorage）
 *   - refresh token 由后端以 httpOnly cookie 设置，前端不直接读取
 *   - 401 自动续期：调用 /auth/refresh（依赖 cookie），成功后把新 token 写回 tokenStore
 *
 * 历史 localStorage 版本的断言已不再适用，整体重写。
 */

const mockState: {
  requestHandler: ((config: any) => any) | null;
  successHandler: ((response: any) => any) | null;
  errorHandler: ((error: any) => Promise<any>) | null;
  post: any;
  client: any;
} = {
  requestHandler: null,
  successHandler: null,
  errorHandler: null,
  post: null,
  client: null,
};

vi.mock('axios', () => {
  const mockPost = vi.fn((url: string) => {
    if (url === '/auth/refresh') {
      return Promise.resolve({ data: { token: 'refreshed-access' } });
    }
    return Promise.resolve({ data: {} });
  });
  const mockClient = vi.fn((config: any) => Promise.resolve(config));
  Object.assign(mockClient, {
    interceptors: {
      request: { use: (h: any) => { mockState.requestHandler = h; } },
      response: { use: (h1: any, h2: any) => { mockState.successHandler = h1; mockState.errorHandler = h2; } },
    },
    post: mockPost,
    get: vi.fn(),
    defaults: { headers: { common: {} } },
  });
  mockState.post = mockPost;
  mockState.client = mockClient;
  return {
    default: {
      create: () => mockClient,
    },
  };
});

// Mock tokenStore so we can observe set/clear calls without depending on module state.
vi.mock('../../lib/tokenStore', async () => {
  let current: string | null = null;
  return {
    getToken: () => current,
    setToken: (t: string | null) => { current = t; },
    clearToken: () => { current = null; },
    __reset: () => { current = null; },
  };
});

describe('API client', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset tokenStore module state via dynamic import (mock exposes __reset only at runtime)
    const store: any = await import('../../lib/tokenStore');
    store.__reset?.();
    await import('../client');
  });

  describe('request interceptor', () => {
    it('attaches Bearer token when token exists in tokenStore', async () => {
      const { setToken } = await import('../../lib/tokenStore');
      setToken('test-token');
      const config = { headers: {} };
      const result = mockState.requestHandler!(config);
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('does not attach Bearer token when no token in tokenStore', () => {
      const config = { headers: {} };
      const result = mockState.requestHandler!(config);
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('adds X-Trace-Id header', () => {
      const config = { headers: {} };
      const result = mockState.requestHandler!(config);
      expect(result.headers['X-Trace-Id']).toBeDefined();
      expect(typeof result.headers['X-Trace-Id']).toBe('string');
    });

    it('does not overwrite existing X-Trace-Id', () => {
      const config = { headers: { 'X-Trace-Id': 'existing-id' } };
      const result = mockState.requestHandler!(config);
      expect(result.headers['X-Trace-Id']).toBe('existing-id');
    });
  });

  describe('response interceptor - success unwrapping', () => {
    it('unwraps { success: true, data } to just data', () => {
      const response = { data: { success: true, data: { id: '1', name: 'test' } } };
      const result = mockState.successHandler!(response);
      expect(result.data).toEqual({ id: '1', name: 'test' });
    });

    it('rejects { success: false } with error message', async () => {
      const response = { data: { success: false, error: { message: 'Something went wrong' } } };
      await expect(() => mockState.successHandler!(response)).rejects.toEqual({ message: 'Something went wrong' });
    });

    it('passes through responses without success field', () => {
      const response = { data: { id: '1', name: 'test' } };
      const result = mockState.successHandler!(response);
      expect(result).toBe(response);
    });
  });

  describe('response interceptor - 401 auto-refresh', () => {
    it('rejects non-401 errors without attempting refresh', async () => {
      const error = { config: {}, response: { status: 500 } };
      await expect(mockState.errorHandler!(error)).rejects.toBe(error);
    });

    it('rejects 401 on /auth/refresh without attempting refresh', async () => {
      const error = { config: { url: '/auth/refresh' }, response: { status: 401 } };
      await expect(mockState.errorHandler!(error)).rejects.toBe(error);
    });

    it('rejects 401 on /auth/logout without attempting refresh', async () => {
      const error = { config: { url: '/auth/logout' }, response: { status: 401 } };
      await expect(mockState.errorHandler!(error)).rejects.toBe(error);
    });

    it('rejects already-retried 401 without attempting refresh', async () => {
      const error = { config: { _retry: true }, response: { status: 401 } };
      await expect(mockState.errorHandler!(error)).rejects.toBe(error);
    });

    it('attempts token refresh and retries original request on success', async () => {
      const { setToken, getToken } = await import('../../lib/tokenStore');
      setToken('old-token');
      mockState.post.mockResolvedValue({ data: { token: 'new-token' } });

      const error = {
        config: { url: '/some-resource', headers: {} },
        response: { status: 401, data: {} },
      };
      const result = await mockState.errorHandler!(error);

      // refresh 走 cookie，body 不应再带 refreshToken
      expect(mockState.post).toHaveBeenCalledWith('/auth/refresh', {}, expect.any(Object));
      expect(getToken()).toBe('new-token');
      // 错误处理 retry 的是 error.config，重试时附带新 token
      expect(result.headers.Authorization).toBe('Bearer new-token');
    });

    it('queues concurrent 401s and retries both after refresh', async () => {
      const { setToken } = await import('../../lib/tokenStore');
      setToken('old-token');
      mockState.post.mockResolvedValue({ data: { token: 'new-token' } });

      const error1 = {
        config: { url: '/resource-1', headers: {} },
        response: { status: 401, data: {} },
      };
      const error2 = {
        config: { url: '/resource-2', headers: {} },
        response: { status: 401, data: {} },
      };

      const promise1 = mockState.errorHandler!(error1);
      const promise2 = mockState.errorHandler!(error2);

      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1.headers.Authorization).toBe('Bearer new-token');
      expect(result2.headers.Authorization).toBe('Bearer new-token');
    });

    it('clears auth and dispatches logout when refresh fails', async () => {
      const { setToken, getToken } = await import('../../lib/tokenStore');
      setToken('old-token');
      mockState.post.mockRejectedValue(new Error('Refresh failed'));

      const error = {
        config: { url: '/some-resource', headers: {} },
        response: { status: 401, data: {} },
      };
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      await expect(mockState.errorHandler!(error)).rejects.toThrow('Refresh failed');
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth:logout' }));
      expect(getToken()).toBeNull();
    });

    it('dispatches logout when refresh fails with no access token', async () => {
      // access token 为空 → 续期流程会尝试 refresh，失败后触发 auth:logout
      mockState.post.mockRejectedValue(new Error('Refresh failed'));

      const error = {
        config: { url: '/some-resource', headers: {} },
        response: { status: 401, data: {} },
      };
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      await expect(mockState.errorHandler!(error)).rejects.toThrow('Refresh failed');
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth:logout' }));
    });
  });
});
