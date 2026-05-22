import { prisma } from '../../prisma';

type LevelCfg = { level: number; slaMinutes: number };

type ReviewWorkflowConfig = {
  enabled: boolean;
  maxLevel: number;
  levels: LevelCfg[];
};

const DEFAULT_CACHE_MS = 30_000;
let cache: { value: ReviewWorkflowConfig; expiresAt: number } | null = null;

const parseJson = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const normalize = (raw: any): ReviewWorkflowConfig => {
  const enabled = raw?.enabled !== false;
  const levels = Array.isArray(raw?.levels) ? raw.levels : [];
  const fixed: LevelCfg[] = levels
    .map((l: any) => ({ level: Number(l.level), slaMinutes: Number(l.slaMinutes) }))
    .filter((l) => Number.isFinite(l.level) && l.level >= 1 && Number.isFinite(l.slaMinutes) && l.slaMinutes >= 1)
    .sort((a, b) => a.level - b.level);

  const maxLevel = Number.isFinite(Number(raw?.maxLevel)) ? Math.max(1, Math.min(10, Number(raw.maxLevel))) : 3;
  const withDefaults = fixed.length > 0 ? fixed : [{ level: 1, slaMinutes: 30 }, { level: 2, slaMinutes: 30 }, { level: 3, slaMinutes: 60 }];
  return { enabled, maxLevel, levels: withDefaults };
};

export class ReviewWorkflowConfigService {
  static async getConfig(): Promise<ReviewWorkflowConfig> {
    const now = Date.now();
    if (cache && cache.expiresAt > now) return cache.value;

    const fallback = normalize({});
    try {
      const row = await prisma.siteConfig.findUnique({ where: { key: 'reviewWorkflowConfig' } });
      const parsed = row?.value ? parseJson(row.value) : null;
      const cfg = normalize(parsed || {});
      cache = { value: cfg, expiresAt: now + DEFAULT_CACHE_MS };
      return cfg;
    } catch {
      cache = { value: fallback, expiresAt: now + DEFAULT_CACHE_MS };
      return fallback;
    }
  }

  static clearCache() {
    cache = null;
  }
}

