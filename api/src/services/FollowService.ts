import { prisma } from '../prisma';
import type { Prisma } from '@prisma/client';
import { AppError } from '../utils/http';
import { cursorPaginate } from '../utils/pagination';

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

    // 创建关注记录 + 同步 followerCount/followingCount + 写 Activity，全部在同一事务内完成。
    // 历史注释曾依赖不存在的 follow_after_insert 触发器，导致计数恒为 0；现改为显式更新。
    const follow = await prisma.$transaction(async (tx) => {
      const created = await tx.follow.create({
        data: { followerId, followingId },
      });

      // 被关注者的粉丝数 +1，关注者的关注数 +1
      await tx.user.update({
        where: { id: followingId },
        data: { followerCount: { increment: 1 } },
      });
      await tx.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      });

      await tx.activity.create({
        data: {
          actorId: followerId,
          type: 'follow',
          targetType: 'user',
          targetId: followingId,
          metadata: JSON.stringify({ username: targetUser.username }),
        },
      });

      return created;
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

    // 删除关注记录 + 同步递减计数，全部在同一事务内完成。
    // 用 updateMany({ where: { ... } }) 而非 update，避免并发取消时唯一记录已删的边界。
    await prisma.$transaction(async (tx) => {
      await tx.follow.delete({ where: { id: existing.id } });

      // 用 updateMany 保证即便 follower/following 已被级联删除也不会抛 P2025
      await tx.user.updateMany({
        where: { id: followingId },
        data: { followerCount: { decrement: 1 } },
      });
      await tx.user.updateMany({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      });
    });

    return { success: true, message: '已取消关注' };
  }

  /**
   * Get paginated followers of a user.
   */
  static async getFollowers(userId: string, cursor?: string, limit: number = 20) {
    const args: Prisma.FollowFindManyArgs = {
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
      args.cursor = { id: cursor };
      args.skip = 1;
    }

    type FollowWithFollower = Prisma.FollowGetPayload<{
      include: { follower: { select: { id: true; username: true; avatarUrl: true; followerCount: true } } }
    }>;
    const follows = await prisma.follow.findMany({
      ...args,
      include: { follower: { select: { id: true, username: true, avatarUrl: true, followerCount: true } } },
    }) as unknown as FollowWithFollower[];
    const { data, nextCursor } = cursorPaginate(follows, limit);

    return {
      data: data.map((f) => f.follower),
      nextCursor,
    };
  }

  /**
   * Get paginated users that a user is following.
   */
  static async getFollowing(userId: string, cursor?: string, limit: number = 20) {
    const args: Prisma.FollowFindManyArgs = {
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
      args.cursor = { id: cursor };
      args.skip = 1;
    }

    type FollowWithFollowing = Prisma.FollowGetPayload<{
      include: { following: { select: { id: true; username: true; avatarUrl: true; followerCount: true } } }
    }>;
    const follows = await prisma.follow.findMany({
      ...args,
      include: { following: { select: { id: true, username: true, avatarUrl: true, followerCount: true } } },
    }) as unknown as FollowWithFollowing[];
    const { data, nextCursor } = cursorPaginate(follows, limit);

    return {
      data: data.map((f) => f.following),
      nextCursor,
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
   * Merges stories, branches, spinoffs ordered by (createdAt desc, id desc).
   *
   * Uses "over-fetch from each table, merge, then slice" pattern.
   * To compensate for items that are filtered out per-page, we fetch
   * `limit * 3` from each source table (capped). Cursor-based pagination
   * uses createdAt as a time-based offset to avoid duplicates across pages.
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
    // Over-fetch to ensure enough items after merging from 3 tables
    const fetchPerTable = Math.min(safeLimit * 3, 150);

    // Parse cursor → timestamp for "older than this" filter
    const cursorDate = cursor ? new Date(cursor) : null;

    // Build a shared "older than cursor" condition for Prisma
    const olderThanCursor = cursorDate
      ? { createdAt: { lt: cursorDate } }
      : {};

    const [stories, branches, spinoffs] = await Promise.all([
      prisma.story.findMany({
        where: { authorId: { in: followedIds }, status: 'published', ...olderThanCursor },
        take: fetchPerTable,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, description: true, authorId: true, createdAt: true },
      }),
      prisma.branch.findMany({
        where: { authorId: { in: followedIds }, status: 'published', ...olderThanCursor },
        take: fetchPerTable,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, description: true, authorId: true, parentStoryId: true, createdAt: true },
      }),
      prisma.spinoff.findMany({
        where: { authorId: { in: followedIds }, status: { in: ['ongoing', 'completed'] }, ...olderThanCursor },
        take: fetchPerTable,
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

    // Stable sort: primary by createdAt desc, secondary by id desc (prevents tie-break ambiguity)
    items.sort((a, b) => {
      const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return b.id > a.id ? 1 : b.id < a.id ? -1 : 0;
    });

    const sliced = items.slice(0, safeLimit);

    // Fetch author usernames in batch
    const authorIds = [...new Set(sliced.map((i) => i.authorId))];
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, username: true, avatarUrl: true },
    });
    const authorMap = new Map(authors.map((a) => [a.id, a]));

    // Cursor is the createdAt of the last returned item
    const lastItem = sliced[sliced.length - 1];
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
      nextCursor: lastItem ? lastItem.createdAt.toISOString() : null,
    };
  }
}
