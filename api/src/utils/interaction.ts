export const RATING_REASON_TAGS = [
  '剧情精彩',
  '人物立体',
  '文笔优美',
  '设定新颖',
  '节奏紧凑',
  '情感真挚',
  '脑洞大开',
  '逻辑严密',
  '更新稳定',
  '互动性强',
  '值得收藏',
  '强烈推荐',
];

export const SHARE_PLATFORMS = ['wechat', 'weibo', 'qq', 'copy', 'twitter', 'facebook'] as const;

export type SharePlatform = (typeof SHARE_PLATFORMS)[number];

