import { prisma } from '../../prisma';
import { moderationConfigSchema, type ModerationConfig } from './config';

const DEFAULT_CACHE_MS = 30_000;

type Cache = {
  value: ModerationConfig;
  expiresAt: number;
};

let cache: Cache | null = null;

const parseJson = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const applyEnvOverrides = (base: ModerationConfig): ModerationConfig => {
  const mode = process.env.MODERATION_MODE;
  const rolloutEnabled = process.env.MODERATION_ROLLOUT_ENABLED;
  const rolloutPercent = process.env.MODERATION_ROLLOUT_PERCENT;

  const merged: any = { ...base };

  if (mode && ['off', 'observe', 'enforce'].includes(mode)) merged.mode = mode;
  if (rolloutEnabled && ['true', 'false'].includes(rolloutEnabled)) merged.rollout.enabled = rolloutEnabled === 'true';
  if (rolloutPercent && !Number.isNaN(Number(rolloutPercent))) merged.rollout.percent = Number(rolloutPercent);

  return moderationConfigSchema.parse(merged);
};

export class ModerationConfigService {
  static async getConfig(): Promise<ModerationConfig> {
    const now = Date.now();
    if (cache && cache.expiresAt > now) return cache.value;

    const fallback = moderationConfigSchema.parse({});

    try {
      const row = await prisma.siteConfig.findUnique({ where: { key: 'moderationConfig' } });
      const parsed = row?.value ? parseJson(row.value) : null;
      const cfg = parsed ? moderationConfigSchema.parse(parsed) : fallback;
      const finalCfg = applyEnvOverrides(cfg);
      cache = { value: finalCfg, expiresAt: now + DEFAULT_CACHE_MS };
      return finalCfg;
    } catch {
      const finalCfg = applyEnvOverrides(fallback);
      cache = { value: finalCfg, expiresAt: now + DEFAULT_CACHE_MS };
      return finalCfg;
    }
  }

  static clearCache() {
    cache = null;
  }
}

