import { prisma } from '../prisma';
import { AppError } from '../utils/http';

export class FollowService {
  /**
   * Follow a user.
   * Increments both followerCount and followingCount atomically.
   * Creates an Activity event for the follow.
   */
  static async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new AppError(400, 'BAD_REQUEST', '不能关注自己');
    }

    // Check target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: followingId } });
    if (!targetUser) {
      throw new AppError(404, 'NOT_FOUND', '用户不存在');
    }

    // Check existing follow
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) {
      throw new AppError(400, 'DUPLICATE', '已经关注了该用户');
    }

    // Create follow record; counters are maintained by DB triggers (follow_after_insert)
    const follow = await prisma.follow.create({
      data: { followerId, followingId },
    });
    // No manual counter update needed - trigger handles it

    // Create activity event
    await prisma.activity.create({
      data: {
        actorId: followerId,
        type: 'follow',
        targetType: 'user',
        targetId: followingId,
        metadata: JSON.stringify({ username: targetUser.username }),
      },
    });

    return follow;
  }

  /**
   * Unfollow a user.
   * Decrements both followerCount and followingCount atomically.
   */
  static async unfollowUser(followerId: string, followingId: string) {
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', '未关注该用户');
    }

    // Delete follow record; counters are maintained by DB triggers (follow_after_delete)
    await prisma.follow.delete({
      where: { id: existing.id },
    });
    // No manual counter update needed - trigger handles it

    return { success: true, message: '已取消关注' };
  }

  /**
   * Get paginated followers of a user.
   */
  static async getFollowers(userId: string, cursor?: string, limit: number = 20) {
    const query: any = {
      where: { followingId: userId },
      include: {
        follower: {
          select: { id: true, username: true, avatarUrl: true, followerCount: true },
        },
      },
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const follows = (await prisma.follow.findMany(query)) as any[];
    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;

    return {
      data: items.map((f) => f.follower),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  /**
   * Get paginated users that a user is following.
   */
  static async getFollowing(userId: string, cursor?: string, limit: number = 20) {
    const query: any = {
      where: { followerId: userId },
      include: {
        following: {
          select: { id: true, username: true, avatarUrl: true, followerCount: true },
        },
      },
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const follows = (await prisma.follow.findMany(query)) as any[];
    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;

    return {
      data: items.map((f) => f.following),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  /**
   * Check if followerId is following followingId.
   */
  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return !!follow;
  }

  /**
   * Batch check follow status for multiple target users.
   */
  static async getFollowStatus(followerId: string, followingIds: string[]): Promise<Record<string, boolean>> {
    const follows = await prisma.follow.findMany({
      where: {
        followerId,
        followingId: { in: followingIds },
      },
      select: { followingId: true },
    });

    const statusMap: Record<string, boolean> = {};
    for (const id of followingIds) {
      statusMap[id] = follows.some((f) => f.followingId === id);
    }
    return statusMap;
  }

  /**
   * Get activity feed: recent content from followed users.
   * Merges stories, branches, spinoffs ordered by createdAt desc.
   */
  static async getFollowActivity(
    userId: string,
    cursor?: string,
    limit: number = 20,
  ) {
    // Get list of followed user IDs
    const followedUsers = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followedIds = followedUsers.map((f) => f.followingId);
    if (followedIds.length === 0) return { data: [], nextCursor: null };

    const safeLimit = Math.min(limit, 50);

    // HACK: fetch more from each table, merge in app code, take top N
    const [stories, branches, spinoffs] = await Promise.all([
      prisma.story.findMany({
        where: { authorId: { in: followedIds }, status: 'published' },
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, description: true, authorId: true, createdAt: true },
      }),
      prisma.branch.findMany({
        where: { authorId: { in: followedIds }, status: 'published' },
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, description: true, authorId: true, parentStoryId: true, createdAt: true },
      }),
      prisma.spinoff.findMany({
        where: { authorId: { in: followedIds }, status: { in: ['ongoing', 'completed'] } },
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, summary: true, authorId: true, originalStoryId: true, createdAt: true },
      }),
    ]);

    type ActivityItem = {
      id: string;
      type: 'story' | 'branch' | 'spinoff';
      title: string;
      description: string;
      authorId: string;
      storyId?: string;
      createdAt: Date;
    };

    const items: ActivityItem[] = [
      ...stories.map((s) => ({ id: s.id, type: 'story' as const, title: s.title, description: s.description || '', authorId: s.authorId, storyId: s.id, createdAt: s.createdAt })),
      ...branches.map((b) => ({ id: b.id, type: 'branch' as const, title: b.title, description: b.description || '', authorId: b.authorId, storyId: b.parentStoryId, createdAt: b.createdAt })),
      ...spinoffs.map((s) => ({ id: s.id, type: 'spinoff' as const, title: s.title, description: s.summary || '', authorId: s.authorId, storyId: s.originalStoryId, createdAt: s.createdAt })),
    ];

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const sliced = items.slice(0, safeLimit);

    // Fetch author usernames in batch
    const authorIds = [...new Set(sliced.map((i) => i.authorId))];
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, username: true, avatarUrl: true },
    });
    const authorMap = new Map(authors.map((a) => [a.id, a]));

    return {
      data: sliced.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        storyId: item.storyId,
        author: authorMap.get(item.authorId) || null,
        createdAt: item.createdAt,
      })),
      nextCursor: sliced.length >= safeLimit ? sliced[sliced.length - 1].createdAt.toISOString() : null,
    };
  }
}
