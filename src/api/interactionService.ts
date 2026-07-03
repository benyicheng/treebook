import client from './client';
import type { InteractionStats, LikeResponse, ShareResponse, RatingRequest, SharePlatform, TargetType, ShareConfig } from './types';
export type { InteractionStats, LikeResponse, ShareResponse, RatingRequest, SharePlatform, TargetType, ShareConfig };

export const RATING_REASON_TAGS = [
  '剧情精彩', '人物立体', '文笔优美', '设定新颖', 
  '节奏紧凑', '情感真挚', '脑洞大开', '逻辑严密',
  '更新稳定', '互动性强', '值得收藏', '强烈推荐'
];

export const interactionService = {
  getStats: async (targetType: string, targetId: string): Promise<InteractionStats> => {
    const { data } = await client.get<any>(`/interactions/${targetType}/${targetId}`);
    return data;
  },

  toggleLike: async (targetType: string, targetId: string): Promise<LikeResponse> => {
    const { data } = await client.post<any>(`/interactions/${targetType}/${targetId}/like`);
    return data;
  },

  submitRating: async (targetType: string, targetId: string, request: RatingRequest): Promise<InteractionStats> => {
    const { data } = await client.put<any>(`/interactions/${targetType}/${targetId}/rating`, request);
    return data;
  },

  recordShare: async (targetType: string, targetId: string, platform: SharePlatform): Promise<ShareResponse> => {
    const { data } = await client.post<any>(`/interactions/${targetType}/${targetId}/share`, { platform });
    return data;
  },

  generateShareConfig: (
    platform: SharePlatform,
    targetType: string,
    targetId: string,
    title: string,
    description: string,
    imageUrl?: string
  ): ShareConfig => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    let url = '';
    
    switch (targetType) {
      case 'story':
        url = `${baseUrl}/story/${targetId}`;
        break;
      case 'booklist':
        url = `${baseUrl}/booklist/${targetId}`;
        break;
      case 'spinoff':
        url = `${baseUrl}/spinoff/${targetId}`;
        break;
      case 'event':
        url = `${baseUrl}/events/${targetId}`;
        break;
      default:
        url = baseUrl;
    }

    return {
      platform,
      title,
      description,
      url,
      imageUrl
    };
  },

  executeShare: async (config: ShareConfig): Promise<boolean> => {
    const { platform, title, description, url, imageUrl } = config;
    
    switch (platform) {
      case 'wechat':
        return true;
        
      case 'weibo':
        const weiboUrl = `https://service.weibo.com/share/share.php?title=${encodeURIComponent(title + ' ' + description)}&url=${encodeURIComponent(url)}&pic=${encodeURIComponent(imageUrl || '')}`;
        window.open(weiboUrl, '_blank', 'width=600,height=500');
        return true;
        
      case 'qq':
        const qqUrl = `https://connect.qq.com/widget/shareqq/index.html?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}&url=${encodeURIComponent(url)}&pics=${encodeURIComponent(imageUrl || '')}`;
        window.open(qqUrl, '_blank', 'width=600,height=500');
        return true;
        
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title + ' ' + description)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
        return true;
        
      case 'facebook':
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(fbUrl, '_blank', 'width=600,height=400');
        return true;
        
      case 'copy':
        try {
          await navigator.clipboard.writeText(`${title}\n${description}\n${url}`);
          return true;
        } catch {
          return false;
        }
        
      default:
        return false;
    }
  }
};
