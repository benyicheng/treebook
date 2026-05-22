import { AppError } from '../../utils/http';
import { InteractionRepository } from './InteractionRepository';
import type { TargetType } from './types';

export class InteractionDomainService {
  static async getInteractionStats(targetType: TargetType, targetId: string, userId?: string) {
    await InteractionRepository.ensureTargetExists(targetType, targetId);

    const stat = await InteractionRepository.getStat(targetType, targetId);

    const likeCount = stat?.likeCount || 0;
    const shareCount = stat?.shareCount || 0;
    const ratingCount = stat?.ratingCount || 0;
    const ratingSum = stat?.ratingSum || 0;
    const ratingAvg = ratingCount > 0 ? ratingSum / ratingCount / 2 : 0;

    const [liked, myRating, dist] = await Promise.all([
      userId ? InteractionRepository.getUserLiked(userId, targetType, targetId) : Promise.resolve(null),
      userId ? InteractionRepository.getUserRating(userId, targetType, targetId) : Promise.resolve(null),
      InteractionRepository.getRatingDist(targetType, targetId),
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
    await InteractionRepository.ensureTargetExists(targetType, targetId);
    return InteractionRepository.toggleLike(targetType, targetId, userId);
  }

  static async updateRating(targetType: TargetType, targetId: string, userId: string, score: number, reasonTags: string[]) {
    await InteractionRepository.ensureTargetExists(targetType, targetId);

    const valueInt = Math.round(score * 2);
    if (valueInt < 1 || valueInt > 10) throw new AppError(400, 'VALIDATION_ERROR', 'Invalid score');

    const tags = Array.isArray(reasonTags)
      ? reasonTags.filter((t) => typeof t === 'string').map((t) => t.trim()).filter((t) => t.length > 0).slice(0, 5)
      : [];

    await InteractionRepository.updateRating(targetType, targetId, userId, valueInt, tags);
    return this.getInteractionStats(targetType, targetId, userId);
  }

  static async recordShare(targetType: TargetType, targetId: string, platform?: string) {
    await InteractionRepository.ensureTargetExists(targetType, targetId);
    return InteractionRepository.recordShare(targetType, targetId);
  }
}

