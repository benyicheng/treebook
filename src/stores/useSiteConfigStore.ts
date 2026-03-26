import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
          const response = await fetch('/api/cms');

          if (!response.ok) {
            console.error('Failed to fetch site config:', response.status, response.statusText);
            // 即使 API 失败，也使用默认配置
            set({ config: DEFAULT_CONFIG, isLoading: false });
            return;
          }

          const data = await response.json();
          console.log('Fetched site config:', data);

          // 合并后端返回的配置到默认配置
          set({
            config: { ...DEFAULT_CONFIG, ...data },
            isLoading: false,
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : '未知错误';
          console.error('Failed to fetch site config:', errorMessage);

          // 即使失败，也使用默认配置
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
          const token = localStorage.getItem('token');
          const response = await fetch('/api/cms', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '更新配置失败');
          }

          const result = await response.json();
          console.log('配置更新成功:', result);

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
