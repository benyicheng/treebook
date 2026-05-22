import { InteractionDomainService } from '../domains/interactions/InteractionDomainService';
import type { TargetType } from '../domains/interactions/types';

export type { TargetType };

export class InteractionService {
  static isTargetType(t: string): t is TargetType {
    return ['story', 'chapter', 'booklist', 'spinoff'].includes(t);
  }

  static async getInteractionStats(targetType: TargetType, targetId: string, userId?: string) {
    return InteractionDomainService.getInteractionStats(targetType, targetId, userId);
  }

  static async toggleLike(targetType: TargetType, targetId: string, userId: string) {
    return InteractionDomainService.toggleLike(targetType, targetId, userId);
  }

  static async updateRating(targetType: TargetType, targetId: string, userId: string, score: number, reasonTags: string[]) {
    return InteractionDomainService.updateRating(targetType, targetId, userId, score, reasonTags);
  }

  static async recordShare(targetType: TargetType, targetId: string, platform?: string) {
    return InteractionDomainService.recordShare(targetType, targetId, platform);
  }
}
