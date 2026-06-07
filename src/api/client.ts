import axios from 'axios';

// 核心逻辑：如果是本地开发连 3001，如果是服务器部署则使用相对路径 /api
// 配合 Nginx 反向代理，彻底消除跨域问题
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : '/api';

const client = axios.create({
  baseURL: API_URL,
});

// --- Refresh Token State ---
// Guards against concurrent /refresh calls: only one refresh at a time,
// subsequent 401s queue up and retry after the refresh completes.
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

// --- Request Interceptor ---
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
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
      // Log non-trivial errors (skip "No token provided" which is expected)
      const message = error.response?.data?.error?.message || error.response?.data?.message || error.message;
      if (!(error.response?.status === 401 && message === 'No token provided')) {
        console.error('API Error:', message);
      }
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      // No refresh token available — force logout
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another refresh is in-flight — queue this request
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
      const { data } = await client.post<{ token: string; refreshToken: string }>(
        '/auth/refresh',
        { refreshToken },
        {
          // Send the (possibly expired) access token so the server can identify the user
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      // The success interceptor has already unwrapped response.data.data → data
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);

      // Retry the original request with the fresh token
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      processQueue(null, data.token);
      return client(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
