import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // 状态管理 + 数据请求
          'vendor-state': ['@tanstack/react-query', 'zustand'],
          // Markdown 和编辑器
          'vendor-editor': ['react-markdown', 'react-syntax-highlighter', 'reactflow'],
          // UI 图标库
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
