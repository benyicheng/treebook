import axios from 'axios';
import { getToken, clearToken } from '../lib/tokenStore';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : '/api';

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.headers['X-Trace-Id']) {
    const traceId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    config.headers['X-Trace-Id'] = traceId;
  }
  return config;
});

// --- Response Interceptor (auto-refresh on 401) ---
client.interceptors.response.use(
  (response) => {
    // 兼容新版统一返回格式 { success: true, data: T }
    if (response.data && typeof response.data.success === 'boolean') {
      if (response.data.success) {
        return {
          ...response,
          data: response.data.data !== undefined ? response.data.data : response.data
        };
      } else {
        return Promise.reject(response.data.error || { message: 'Unknown error' });
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 errors that are NOT the /refresh or /auth/logout endpoint
    // and have not already been retried
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === '/auth/refresh' ||
      originalRequest.url === '/auth/logout'
    ) {
      // Skip logging for refresh/logout errors — they are handled upstream
      const message = error.response?.data?.error?.message || error.response?.data?.message || error.message;
      const isRefreshOrLogout = originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/logout';
      if (!isRefreshOrLogout && !(error.response?.status === 401 && message === 'No token provided')) {
        console.error('API Error:', message);
      }
      return Promise.reject(error);
    }

    // No access token at all — skip refresh, avoid browser 401 noise
    if (!getToken()) {
      clearToken();
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await client.post<{ token: string }>(
        '/auth/refresh',
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      const { setToken } = await import('../lib/tokenStore');
      setToken(data.token);

      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      processQueue(null, data.token);
      return client(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearToken();
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
