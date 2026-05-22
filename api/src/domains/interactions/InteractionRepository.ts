import { prisma } from '../../prisma';
import { AppError } from '../../utils/http';
import type { TargetType } from './types';

export class InteractionRepository {
  static async ensureTargetExists(targetType: TargetType, targetId: string) {
    let exists = false;
    switch (targetType) {
      case 'story':
        exists = !!(await prisma.story.findUnique({ where: { id: targetId }, select: { id: true } }));
        break;
      case 'chapter':
        exists = !!(await prisma.chapter.findUnique({ where: { id: targetId }, select: { id: true } }));
        break;
      case 'booklist':
        exists = !!(await prisma.booklist.findUnique({ where: { id: targetId }, select: { id: true } }));
        break;
      case 'spinoff':
        exists = !!(await prisma.spinoff.findUnique({ where: { id: targetId }, select: { id: true } }));
        break;
    }
    if (!exists) throw new AppError(404, 'NOT_FOUND', `${targetType} not found`);
    return true;
  }

  static getStat(targetType: TargetType, targetId: string) {
    return prisma.interactionStat.findUnique({
      where: { targetType_targetId: { targetType, targetId } },
    });
  }

  static getUserLiked(userId: string, targetType: TargetType, targetId: string) {
    return prisma.like.findUnique({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
      select: { id: true },
    });
  }

  static getUserRating(userId: string, targetType: TargetType, targetId: string) {
    return prisma.rating.findUnique({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
      select: { valueInt: true, reasonTags: true },
    });
  }

  static getRatingDist(targetType: TargetType, targetId: string) {
    return prisma.rating.groupBy({
      by: ['valueInt'],
      where: { targetType, targetId },
      _count: { valueInt: true },
    });
  }

  static async toggleLike(targetType: TargetType, targetId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.like.findUnique({
        where: { userId_targetType_targetId: { userId, targetType, targetId } },
        select: { id: true },
      });

      if (existing) {
        await tx.like.delete({ where: { id: existing.id } });
        await tx.interactionStat.upsert({
          where: { targetType_targetId: { targetType, targetId } },
          create: { targetType, targetId, likeCount: 0 },
          update: {},
        });

        await tx.$executeRaw`
          UPDATE "interaction_stats"
          SET "likeCount" = CASE WHEN "likeCount" > 0 THEN "likeCount" - 1 ELSE 0 END
          WHERE "targetType" = ${targetType} AND "targetId" = ${targetId}
        `;

        const stat = await tx.interactionStat.findUnique({
          where: { targetType_targetId: { targetType, targetId } },
          select: { likeCount: true },
        });

        return { liked: false, likeCount: stat?.likeCount || 0 };
      }

      await tx.like.create({ data: { userId, targetType, targetId } });
      const stat = await tx.interactionStat.upsert({
        where: { targetType_targetId: { targetType, targetId } },
        create: { targetType, targetId, likeCount: 1 },
        update: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });

      return { liked: true, likeCount: stat.likeCount };
    });
  }

  static async updateRating(targetType: TargetType, targetId: string, userId: string, valueInt: number, reasonTags: string[]) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.rating.findUnique({
        where: { userId_targetType_targetId: { userId, targetType, targetId } },
        select: { id: true, valueInt: true },
      });

      if (!existing) {
        await tx.rating.create({
          data: {
            userId,
            targetType,
            targetId,
            valueInt,
            reasonTags: JSON.stringify(reasonTags),
          },
        });
        await tx.interactionStat.upsert({
          where: { targetType_targetId: { targetType, targetId } },
          create: { targetType, targetId, ratingCount: 1, ratingSum: valueInt },
          update: { ratingCount: { increment: 1 }, ratingSum: { increment: valueInt } },
        });
        return;
      }

      const delta = valueInt - existing.valueInt;
      await tx.rating.update({
        where: { id: existing.id },
        data: { valueInt, reasonTags: JSON.stringify(reasonTags) },
      });
      await tx.interactionStat.upsert({
        where: { targetType_targetId: { targetType, targetId } },
        create: { targetType, targetId, ratingCount: 1, ratingSum: valueInt },
        update: { ratingSum: { increment: delta } },
      });
    });
  }

  static async recordShare(targetType: TargetType, targetId: string) {
    const stat = await prisma.interactionStat.upsert({
      where: { targetType_targetId: { targetType, targetId } },
      create: { targetType, targetId, shareCount: 1 },
      update: { shareCount: { increment: 1 } },
      select: { shareCount: true },
    });

    return { shareCount: stat.shareCount };
  }
}

