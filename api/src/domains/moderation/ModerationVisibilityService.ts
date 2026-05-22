import { prisma } from '../../prisma';
import { ModerationConfigService } from './ModerationConfigService';
import type { ModerationDecisionStatus, ModerationTargetType } from './types';

type CacheEntry = { status: ModerationDecisionStatus; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_MS = 30_000;

const keyOf = (t: string, id: string) => `${t}:${id}`;

const getLatestStatus = async (targetType: ModerationTargetType, targetId: string) => {
  const k = keyOf(targetType, targetId);
  const now = Date.now();
  const hit = cache.get(k);
  if (hit && hit.expiresAt > now) return hit.status;

  try {
    const rows = await prisma.$queryRaw`
      SELECT "status"
      FROM "moderation_decisions"
      WHERE "targetType" = ${targetType} AND "targetId" = ${targetId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    const status = (rows as any[])[0]?.status as ModerationDecisionStatus | undefined;
    if (status) cache.set(k, { status, expiresAt: now + CACHE_MS });
    return status || null;
  } catch {
    return null;
  }
};

export class ModerationVisibilityService {
  static async shouldMask(targetType: ModerationTargetType, targetId: string) {
    const cfg = await ModerationConfigService.getConfig();
    if (cfg.mode !== 'enforce') return false;
    const status = await getLatestStatus(targetType, targetId);
    return status === 'rejected';
  }

  static maskText(text: string) {
    return text ? '内容已被审核屏蔽' : text;
  }
}

