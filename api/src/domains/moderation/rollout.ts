import crypto from 'crypto';
import type { ModerationConfig } from './config';

const stablePercent = (seed: string) => {
  const h = crypto.createHash('sha256').update(seed).digest();
  const n = h.readUInt32BE(0);
  return (n / 0xffffffff) * 100;
};

export const isInModerationRollout = (cfg: ModerationConfig, userId: string | undefined, businessLine: string) => {
  if (cfg.mode === 'off') return false;
  if (!cfg.rollout.enabled) return true;

  if (cfg.rollout.businessLines.length > 0 && !cfg.rollout.businessLines.includes(businessLine)) return false;
  if (userId && cfg.rollout.userIds.includes(userId)) return true;
  if (!userId) return false;

  return stablePercent(`${businessLine}:${userId}`) < cfg.rollout.percent;
};

