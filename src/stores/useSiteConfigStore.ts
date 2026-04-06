import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import client from '../api/client';

// 站点配置接口
export interface SiteConfig {
  siteName: string;
  siteSlogan: string;
  logoUrl: string;
  faviconUrl: string;
  announcement: string;
  announcementEnabled: string;
  bannerSlides: string; // JSON string
  editorPicks: string; // JSON string
  footerCopyright: string;
  primaryColor: string;
  contactEmail: string;
  icp: string;
  socialWeixin: string;
  socialWeibo: string;
}

// 默认配置
const DEFAULT_CONFIG: SiteConfig = {
  siteName: '平行宇宙',
  siteSlogan: '创作属于你的故事宇宙',
  logoUrl: '',
  faviconUrl: '',
  announcement: '',
  announcementEnabled: 'false',
  bannerSlides: JSON.stringify([]),
  editorPicks: JSON.stringify([]),
  footerCopyright: '© 2026 平行宇宙故事平台. All rights reserved.',
  primaryColor: '#2563eb',
  contactEmail: '',
  icp: '',
  socialWeixin: '',
  socialWeibo: '',
};

// Store 接口定义
interface SiteConfigStore {
  config: SiteConfig;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchConfig: () => Promise<void>;
  updateConfig: (updates: Partial<SiteConfig>) => Promise<void>;
  resetConfig: () => void;
  clearError: () => void;
}

// 创建 Store（带持久化）
export const useSiteConfigStore = create<SiteConfigStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      isLoading: false,
      error: null,

      // 获取站点配置
      fetchConfig: async () => {
        set({ isLoading: true, error: null });

        try {
          // 使用统一的 axios 客户端
          const response = await client.get('/cms');
          
          // client 拦截器已经处理了 { success: true, data: T } 格式
          // 这里的 response.data 就是业务数据 (即之前的 result.data)
          const remoteConfig = response.data || {};

          console.log('Fetched site config:', remoteConfig);

          set({
            config: { ...DEFAULT_CONFIG, ...remoteConfig },
            isLoading: false,
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : '未知错误';
          console.error('Failed to fetch site config:', errorMessage);

          set({
            config: DEFAULT_CONFIG,
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      // 更新站点配置
      updateConfig: async (updates: Partial<SiteConfig>) => {
        set({ isLoading: true, error: null });

        try {
          // 使用统一的 axios 客户端 (会自动带上 Authorization Token)
          const response = await client.put('/cms', updates);

          console.log('配置更新成功:', response.data);

          // 更新本地配置
          set((state) => ({
            config: { ...state.config, ...updates },
            isLoading: false,
          }));
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : '未知错误';
          console.error('Failed to update site config:', errorMessage);

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw new Error(errorMessage);
        }
      },

      // 重置为默认配置
      resetConfig: () => {
        set({ config: DEFAULT_CONFIG, error: null });
      },

      // 清除错误信息
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'site-config-storage',
      partialize: (state) => ({ config: state.config }),
    }
  )
);
