import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { cursorPaginate } from '../utils/pagination';

export class ActivityService {
  /**
   * Create an activity event for a user action.
   * This is called internally by other services.
   */
  static async createActivity(data: {
    actorId: string;
    type: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, any>;
  }) {
    return prisma.activity.create({
      data: {
        actorId: data.actorId,
        type: data.type,
        targetType: data.targetType,
        targetId: data.targetId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  }

  /**
   * Get the activity feed for a user.
   * Shows activities from users they follow, plus their own.
   * Paginated via cursor.
   */
  static async getFeed(userId: string, cursor?: string, limit: number = 30) {
    // Get IDs of users this user follows (including themselves)
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = follows.map((f) => f.followingId);
    followingIds.push(userId); // Include own activities

    const query: any = {
      where: {
        actorId: { in: followingIds },
        // Exclude 'follow' activities from feed (noise) — let UI decide
      },
      include: {
        actor: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const activities = await prisma.activity.findMany(query);
    const { data, nextCursor } = cursorPaginate(activities, limit);

    return {
      data: data.map((a) => ({
        ...a,
        metadata: a.metadata ? JSON.parse(a.metadata) : null,
      })),
      nextCursor,
    };
  }

  /**
   * Get all activities for a specific user (their profile activity).
   */
  static async getUserActivities(
    targetUserId: string,
    cursor?: string,
    limit: number = 20,
  ) {
    const query: any = {
      where: { actorId: targetUserId },
      include: {
        actor: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const activities = await prisma.activity.findMany(query);
    const { data, nextCursor } = cursorPaginate(activities, limit);

    return {
      data: data.map((a) => ({
        ...a,
        metadata: a.metadata ? JSON.parse(a.metadata) : null,
      })),
      nextCursor,
    };
  }
}
