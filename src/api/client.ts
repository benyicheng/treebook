import axios from 'axios';

const API_URL = '/api';

const client = axios.create({
  baseURL: API_URL,
});

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

client.interceptors.response.use(
  (response) => {
    // 兼容新版统一返回格式 { success: true, data: T }
    // 如果是统一格式，我们将 response.data 修改为内部的 data 字段
    // 这样既能保持 Axios 的结构 (有 .data 字段)，又能直接获取业务数据
    if (response.data && typeof response.data.success === 'boolean') {
      if (response.data.success) {
        return {
          ...response,
          data: response.data.data !== undefined ? response.data.data : response.data
        };
      } else {
        // 如果成功标志为 false，则视为错误
        return Promise.reject(response.data.error || { message: 'Unknown error' });
      }
    }
    return response;
  },
  (error) => {
    // 处理 HTTP 错误
    const message = error.response?.data?.error?.message || error.response?.data?.message || error.message;
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default client;
