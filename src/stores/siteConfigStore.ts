// 站点配置 store - 用于管理全局站点设置
import { create } from 'zustand';

// 站点配置的完整接口定义
interface SiteConfig {
  siteName: string;
  siteSlogan: string;
  logoUrl: string;
  faviconUrl: string;
  announcement: string;
  announcementEnabled: boolean;
  bannerSlides: string; // JSON string
  footerCopyright: string;
  primaryColor: string;
  contactEmail: string;
  icp: string;
  socialWeixin: string;
  socialWeibo: string;
  editorPicks: string; // JSON string
}

// Store 接口定义
interface SiteConfigStore {
  config: SiteConfig;
  isLoading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  updateConfig: (updates: Partial<SiteConfig>, token: string) => Promise<void>;
  resetConfig: () => void;
  clearError: () => void;
}

// 默认配置
const DEFAULT_CONFIG: SiteConfig = {
  siteName: '平行宇宙',
  siteSlogan: '创作属于你的故事宇宙',
  logoUrl: '',
  faviconUrl: '',
  announcement: '',
  announcementEnabled: false,
  bannerSlides: JSON.stringify([]),
  footerCopyright: '© 2026 平行宇宙故事平台. All rights reserved.',
  primaryColor: '#2563eb',
  contactEmail: '',
  icp: '',
  socialWeixin: '',
  socialWeibo: '',
  editorPicks: JSON.stringify([]),
};

// 创建 store 并持久化到 localStorage
const useSiteConfigStore = create<SiteConfigStore>((set, get) => ({
  // 初始状态
  config: DEFAULT_CONFIG,
  isLoading: false,
  error: null,

  // 获取站点配置
  fetchConfig: async () => {
    set({ isLoading: true, error: null });

    try {
      const res = await fetch('/api/cms');

      if (!res.ok) {
        console.error('Failed to fetch site config:', res.status, res.statusText);
        set({ config: DEFAULT_CONFIG });
        return;
      }

      const data = await res.json();
      console.log('Fetched site config:', data);

      // 合并后端返回的配置到默认配置
      set({ config: { ...DEFAULT_CONFIG, ...data } });
    } catch (err) {
      console.error('Failed to fetch site config:', err);
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      set({ error: errorMessage, config: DEFAULT_CONFIG });
    } finally {
      set({ isLoading: false });
    }
  },

  // 更新站点配置
  updateConfig: async (updates: Partial<SiteConfig>, token: string) => {
    set({ isLoading: true, error: null });

    try {
      const res = await fetch('/api/cms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '未知错误' }));
        const errorMessage = err.error || '更新配置失败';
        set({ error: errorMessage });
        throw new Error(errorMessage);
      }

      const result = await res.json();
      console.log('Config updated:', result);

      // 更新本地配置
      set({
        config: { ...get().config, ...updates },
        isLoading: false
      });

    } catch (err) {
      console.error('Failed to update site config:', err);
      const errorMessage = err instanceof Error ? err.message : '更新失败';
      set({ error: errorMessage, isLoading: false });
      throw err;
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
}));

export default useSiteConfigStore;
