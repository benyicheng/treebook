import { prisma } from '../prisma';
import { AppError } from '../utils/http';

export type TargetType = 'story' | 'chapter' | 'booklist' | 'spinoff';

export class InteractionService {
  static isTargetType(t: string): t is TargetType {
    return ['story', 'chapter', 'booklist', 'spinoff'].includes(t);
  }

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

  static async getInteractionStats(targetType: TargetType, targetId: string, userId?: string) {
    await this.ensureTargetExists(targetType, targetId);

    const stat = await prisma.interactionStat.findUnique({
      where: { targetType_targetId: { targetType, targetId } },
    });

    const likeCount = stat?.likeCount || 0;
    const shareCount = stat?.shareCount || 0;
    const ratingCount = stat?.ratingCount || 0;
    const ratingSum = stat?.ratingSum || 0;
    const ratingAvg = ratingCount > 0 ? ratingSum / ratingCount / 2 : 0;

    const [liked, myRating, dist] = await Promise.all([
      userId
        ? prisma.like.findUnique({
            where: { userId_targetType_targetId: { userId, targetType, targetId } },
            select: { id: true },
          })
        : Promise.resolve(null),
      userId
        ? prisma.rating.findUnique({
            where: { userId_targetType_targetId: { userId, targetType, targetId } },
            select: { valueInt: true, reasonTags: true },
          })
        : Promise.resolve(null),
      prisma.rating.groupBy({
        by: ['valueInt'],
        where: { targetType, targetId },
        _count: { valueInt: true },
      }),
    ]);

    const ratingDist: Record<string, number> = {};
    dist.forEach((row) => {
      ratingDist[String(row.valueInt)] = row._count.valueInt;
    });

    return {
      targetType,
      targetId,
      likeCount,
      shareCount,
      ratingCount,
      ratingAvg,
      ratingDist,
      liked: !!liked,
      myRating: myRating ? myRating.valueInt / 2 : null,
      myReasonTags: myRating?.reasonTags ? (JSON.parse(myRating.reasonTags) as string[]) : [],
    };
  }

  static async toggleLike(targetType: TargetType, targetId: string, userId: string) {
    await this.ensureTargetExists(targetType, targetId);

    return prisma.$transaction(async (tx) => {
      const existing = await tx.like.findUnique({
        where: { userId_targetType_targetId: { userId, targetType, targetId } },
        select: { id: true },
      });

      if (existing) {
        await tx.like.delete({ where: { id: existing.id } });
        const stat = await tx.interactionStat.upsert({
          where: { targetType_targetId: { targetType, targetId } },
          create: { targetType, targetId, likeCount: 0 },
          update: { likeCount: { decrement: 1 } },
          select: { likeCount: true }
        });
        return { liked: false, likeCount: Math.max(0, stat.likeCount) };
      }

      await tx.like.create({ data: { userId, targetType, targetId } });
      const stat = await tx.interactionStat.upsert({
        where: { targetType_targetId: { targetType, targetId } },
        create: { targetType, targetId, likeCount: 1 },
        update: { likeCount: { increment: 1 } },
        select: { likeCount: true }
      });
      return { liked: true, likeCount: stat.likeCount };
    });
  }

  static async updateRating(targetType: TargetType, targetId: string, userId: string, score: number, reasonTags: string[]) {
    await this.ensureTargetExists(targetType, targetId);

    const valueInt = Math.round(score * 2);
    if (valueInt < 1 || valueInt > 10) throw new AppError(400, 'VALIDATION_ERROR', 'Invalid score');

    const tags = Array.isArray(reasonTags) 
      ? reasonTags.filter(t => typeof t === 'string').map(t => t.trim()).filter(t => t.length > 0).slice(0, 5)
      : [];

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
            reasonTags: JSON.stringify(tags),
          },
        });
        await tx.interactionStat.upsert({
          where: { targetType_targetId: { targetType, targetId } },
          create: { targetType, targetId, ratingCount: 1, ratingSum: valueInt },
          update: { ratingCount: { increment: 1 }, ratingSum: { increment: valueInt } },
        });
      } else {
        const delta = valueInt - existing.valueInt;
        await tx.rating.update({
          where: { id: existing.id },
          data: { valueInt, reasonTags: JSON.stringify(tags) },
        });
        await tx.interactionStat.upsert({
          where: { targetType_targetId: { targetType, targetId } },
          create: { targetType, targetId, ratingCount: 1, ratingSum: valueInt },
          update: { ratingSum: { increment: delta } },
        });
      }
    });

    return this.getInteractionStats(targetType, targetId, userId);
  }

  static async recordShare(targetType: TargetType, targetId: string) {
    await this.ensureTargetExists(targetType, targetId);

    const stat = await prisma.interactionStat.upsert({
      where: { targetType_targetId: { targetType, targetId } },
      create: { targetType, targetId, shareCount: 1 },
      update: { shareCount: { increment: 1 } },
      select: { shareCount: true },
    });

    return { shareCount: stat.shareCount };
  }
}
