import { prisma } from '../prisma';

export type DiscoverTab = 'hot' | 'latest';

interface UniverseFeedItem {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  branchCount: number;
  chapterCount: number;
  spinoffCount: number;
  readingPathCount: number;
  activeReaders: number;
  hotPathsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UniverseFeedResult {
  items: UniverseFeedItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class DiscoverService {
  /**
   * 获取宇宙发现 feed
   * - hot tab: 按 7 日内 InteractionEvent 活跃度排序
   * - latest tab: 按创建时间倒序
   */
  static async getUniverseFeed(
    tab: DiscoverTab = 'hot',
    page: number = 1,
    limit: number = 20,
  ): Promise<UniverseFeedResult> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * safeLimit;

    const total = await prisma.story.count({ where: { status: { not: 'deleted' } } });

    let items: UniverseFeedItem[];

    if (tab === 'latest') {
      const stories = await prisma.story.findMany({
        where: { status: { not: 'deleted' } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          _count: {
            select: { branches: true, chapters: true, spinoffs: true, readingPaths: true },
          },
        },
      });

      items = stories.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        coverImage: s.coverImage,
        status: s.status,
        author: s.author,
        branchCount: s._count.branches,
        chapterCount: s._count.chapters,
        spinoffCount: s._count.spinoffs,
        readingPathCount: s._count.readingPaths,
        activeReaders: 0,
        hotPathsCount: 0,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    } else {
      // hot tab: 按 7 日内 InteractionEvent 数量排序
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const stories = await prisma.story.findMany({
        where: { status: { not: 'deleted' } },
        skip,
        take: safeLimit,
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          _count: {
            select: { branches: true, chapters: true, spinoffs: true, readingPaths: true },
          },
        },
      });

      const storyIds = stories.map((s) => s.id);
      const activityCounts = new Map<string, number>();

      if (storyIds.length > 0) {
        const events = await prisma.interactionEvent.groupBy({
          by: ['targetId'],
          where: {
            targetType: 'story',
            targetId: { in: storyIds },
            createdAt: { gte: sevenDaysAgo },
          },
          _count: { id: true },
        });
        for (const e of events) {
          activityCounts.set(e.targetId, e._count.id);
        }
      }

      items = stories
        .map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          coverImage: s.coverImage,
          status: s.status,
          author: s.author,
          branchCount: s._count.branches,
          chapterCount: s._count.chapters,
          spinoffCount: s._count.spinoffs,
          readingPathCount: s._count.readingPaths,
          activeReaders: activityCounts.get(s.id) ?? 0,
          hotPathsCount: 0,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }))
        .sort((a, b) => b.activeReaders - a.activeReaders);
    }

    return {
      items,
      total,
      page,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }
}
