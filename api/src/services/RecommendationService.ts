import { prisma } from '../prisma';

interface RecommendationItem {
  id: string;
  type: 'story' | 'branch' | 'spinoff';
  title: string;
  description: string;
  author: { id: string; username: string; avatarUrl: string | null };
  storyId: string;
  viewCount: number;
  reason: 'following_network' | 'similar_tags' | 'hot';
}

export class RecommendationService {
  /**
   * 获取个性化推荐
   * 策略：关注网络 > 相似标签 > 热门兜底
   */
  static async getForYou(userId: string, limit: number = 20): Promise<RecommendationItem[]> {
    const safeLimit = Math.min(limit, 50);

    // 策略 1: 从关注网络中推荐（二度网络）
    const networkRecs = await this.getNetworkRecommendations(userId, safeLimit);
    if (networkRecs.length >= safeLimit) return networkRecs.slice(0, safeLimit);

    const remaining = safeLimit - networkRecs.length;
    const seenIds = new Set(networkRecs.map((r) => r.id));

    // 策略 2: 相似标签推荐
    const tagRecs = await this.getTagBasedRecommendations(userId, remaining, seenIds);
    const allIds = new Set([...seenIds, ...tagRecs.map((r) => r.id)]);
    const combined = [...networkRecs, ...tagRecs];

    if (combined.length >= safeLimit) return combined.slice(0, safeLimit);

    // 策略 3: 热门兜底
    const remaining2 = safeLimit - combined.length;
    const hotRecs = await this.getHotRecommendations(remaining2, allIds);

    return [...combined, ...hotRecs];
  }

  /**
   * 策略 1: 关注网络 — 用户关注的人也在看什么
   */
  private static async getNetworkRecommendations(
    userId: string,
    limit: number,
  ): Promise<RecommendationItem[]> {
    const followedIds = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followedIdSet = new Set(followedIds.map((f) => f.followingId));
    if (followedIdSet.size === 0) return [];

    // 获取关注的人最近交互的故事
    const recentInteractions = await prisma.interactionEvent.findMany({
      where: {
        userId: { in: [...followedIdSet] },
        type: { in: ['view', 'like', 'bookmark'] },
        targetType: { in: ['story', 'branch', 'spinoff'] },
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: { targetId: true, targetType: true },
    });

    // 统计出现频率最高的 target
    const freqMap = new Map<string, { targetId: string; targetType: string; count: number }>();
    for (const evt of recentInteractions) {
      if (!evt.targetId) continue;
      const key = `${evt.targetType}:${evt.targetId}`;
      const entry = freqMap.get(key);
      if (entry) entry.count++;
      else freqMap.set(key, { targetId: evt.targetId, targetType: evt.targetType, count: 1 });
    }

    const sorted = [...freqMap.values()]
      .filter((e) => e.targetType !== 'spinoff' || true) // allow all types
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return this.resolveRecommendations(sorted, 'following_network');
  }

  /**
   * 策略 2: 标签相似 — 根据用户浏览过的故事标签推荐相似内容
   */
  private static async getTagBasedRecommendations(
    userId: string,
    limit: number,
    excludeIds: Set<string>,
  ): Promise<RecommendationItem[]> {
    // 获取用户最近浏览的故事
    const recentViews = await prisma.interactionEvent.findMany({
      where: {
        userId,
        type: 'view',
        targetType: 'story',
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { targetId: true },
    });

    const viewedStoryIds = recentViews.map((v) => v.targetId!).filter(Boolean);
    if (viewedStoryIds.length === 0) return [];

    // 获取这些故事的标签
    const viewedStories = await prisma.story.findMany({
      where: { id: { in: viewedStoryIds } },
      select: { tags: { select: { name: true } } },
    });

    const tagFreq = new Map<string, number>();
    for (const s of viewedStories) {
      for (const tag of s.tags) {
        tagFreq.set(tag.name, (tagFreq.get(tag.name) || 0) + 1);
      }
    }

    if (tagFreq.size === 0) return [];

    // 取最频繁的标签
    const topTags = [...tagFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);

    // 根据标签推荐故事
    const stories = await prisma.story.findMany({
      where: {
        id: { notIn: [...excludeIds] },
        status: 'published',
        tags: { some: { name: { in: topTags } } },
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    return stories.map((s) => ({
      id: s.id,
      type: 'story' as const,
      title: s.title,
      description: s.description || '',
      author: s.author,
      storyId: s.id,
      viewCount: s.viewCount,
      reason: 'similar_tags',
    }));
  }

  /**
   * 策略 3: 热门兜底
   */
  private static async getHotRecommendations(
    limit: number,
    excludeIds: Set<string>,
  ): Promise<RecommendationItem[]> {
    const stories = await prisma.story.findMany({
      where: {
        id: { notIn: [...excludeIds] },
        status: 'published',
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    return stories.map((s) => ({
      id: s.id,
      type: 'story' as const,
      title: s.title,
      description: s.description || '',
      author: s.author,
      storyId: s.id,
      viewCount: s.viewCount,
      reason: 'hot',
    }));
  }

  /**
   * 批量解析推荐条目：补充作者、故事信息
   */
  private static async resolveRecommendations(
    entries: { targetId: string; targetType: string; count: number }[],
    reason: RecommendationItem['reason'],
  ): Promise<RecommendationItem[]> {
    const storyIds = entries.filter((e) => e.targetType === 'story').map((e) => e.targetId);
    const branchIds = entries.filter((e) => e.targetType === 'branch').map((e) => e.targetId);
    const spinoffIds = entries.filter((e) => e.targetType === 'spinoff').map((e) => e.targetId);

    const [stories, branches, spinoffs] = await Promise.all([
      storyIds.length > 0
        ? prisma.story.findMany({
            where: { id: { in: storyIds }, status: 'published' },
            include: { author: { select: { id: true, username: true, avatarUrl: true } } },
          })
        : [],
      branchIds.length > 0
        ? prisma.branch.findMany({
            where: { id: { in: branchIds }, status: 'published' },
            include: { author: { select: { id: true, username: true, avatarUrl: true } } },
          })
        : [],
      spinoffIds.length > 0
        ? prisma.spinoff.findMany({
            where: { id: { in: spinoffIds }, status: { in: ['ongoing', 'completed'] } },
            include: { author: { select: { id: true, username: true, avatarUrl: true } } },
          })
        : [],
    ]);

    const storyMap = new Map(stories.map((s) => [s.id, s] as const));
    const branchMap = new Map(branches.map((b) => [b.id, b] as const));
    const spinoffMap = new Map(spinoffs.map((s) => [s.id, s] as const));

    return entries
      .map((e) => {
        const story = storyMap.get(e.targetId);
        const branch = branchMap.get(e.targetId);
        const spinoff = spinoffMap.get(e.targetId);

        if (story) {
          return {
            id: story.id,
            type: 'story' as const,
            title: story.title,
            description: story.description || '',
            author: story.author,
            storyId: story.id,
            viewCount: story.viewCount,
            reason,
          };
        }
        if (branch) {
          return {
            id: branch.id,
            type: 'branch' as const,
            title: branch.title,
            description: branch.description || '',
            author: branch.author,
            storyId: branch.parentStoryId,
            viewCount: branch.viewCount,
            reason,
          };
        }
        if (spinoff) {
          return {
            id: spinoff.id,
            type: 'spinoff' as const,
            title: spinoff.title,
            description: spinoff.summary || '',
            author: spinoff.author,
            storyId: spinoff.originalStoryId,
            viewCount: spinoff.viewCount,
            reason,
          };
        }
        return null;
      })
      .filter((r): r is RecommendationItem => r !== null);
  }
}
