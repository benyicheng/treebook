import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

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

export default client;
