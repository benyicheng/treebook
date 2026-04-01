import client from './client';

export interface InteractionStats {
  targetType: string;
  targetId: string;
  likeCount: number;
  shareCount: number;
  ratingCount: number;
  ratingAvg: number;
  ratingDist: Record<string, number>;
  liked: boolean;
  myRating: number | null;
  myReasonTags: string[];
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
  fraudCheck?: { warning: boolean; confidence: number };
}

export interface ShareResponse {
  shareCount: number;
}

export interface RatingRequest {
  score: number; // 0.5 - 5.0
  reasonTags?: string[];
}

// 分享平台类型
export type SharePlatform = 'wechat' | 'weibo' | 'qq' | 'copy' | 'twitter' | 'facebook';

// 目标类型
export type TargetType = 'story' | 'chapter' | 'booklist' | 'spinoff';

// 分享配置
export interface ShareConfig {
  platform: SharePlatform;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
}

// 评分理由标签
export const RATING_REASON_TAGS = [
  '剧情精彩', '人物立体', '文笔优美', '设定新颖', 
  '节奏紧凑', '情感真挚', '脑洞大开', '逻辑严密',
  '更新稳定', '互动性强', '值得收藏', '强烈推荐'
];

export const interactionService = {
  // 获取互动统计
  getStats: async (targetType: string, targetId: string): Promise<InteractionStats> => {
    const { data } = await client.get<any>(`/interactions/${targetType}/${targetId}`);
    return data.data || data;
  },

  // 点赞/取消点赞
  toggleLike: async (targetType: string, targetId: string): Promise<LikeResponse> => {
    const { data } = await client.post<any>(`/interactions/${targetType}/${targetId}/like`);
    return data.data || data;
  },

  // 提交评分
  submitRating: async (targetType: string, targetId: string, request: RatingRequest): Promise<InteractionStats> => {
    const { data } = await client.put<any>(`/interactions/${targetType}/${targetId}/rating`, request);
    return data.data || data;
  },

  // 记录分享
  recordShare: async (targetType: string, targetId: string, platform: SharePlatform): Promise<ShareResponse> => {
    const { data } = await client.post<any>(`/interactions/${targetType}/${targetId}/share`, { platform });
    return data.data || data;
  },

  // 获取评分理由标签
  getRatingReasonTags: async (): Promise<string[]> => {
    const { data } = await client.get<{ tags: string[] }>('/interactions/rating-reason-tags');
    return data.tags;
  },

  // 生成分享配置
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

  // 执行分享
  executeShare: async (config: ShareConfig): Promise<boolean> => {
    const { platform, title, description, url, imageUrl } = config;
    
    switch (platform) {
      case 'wechat':
        // 微信分享 - 在浏览器环境中显示二维码供用户扫描
        // 实际微信分享需要微信JS-SDK，在浏览器中无法直接调起
        // 这里返回true，由组件显示二维码弹窗
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
