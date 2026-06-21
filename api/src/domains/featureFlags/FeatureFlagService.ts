/**
 * Feature Flag Service
 *
 * 统一的功能开关入口，复用 MediaConfigService 的 env + rolloutPercent 模式。
 * 设计原则：
 * - 静态读取 env，调用时即时求值（便于灰度调整无需重启）
 * - flag 关闭时，调用方必须能完全退回旧行为（零回归保证）
 * - rolloutPercent 支持按 userId 稳定分桶（同一用户每次结果一致）
 *
 * 用法：
 *   if (FeatureFlagService.isEnabled('event_connectors', userId)) { ... }
 *
 * 新增 flag 步骤：
 * 1. 在 FlagKey 联合类型中加入键名
 * 2. 在 FLAG_ENV 配置中登记 env 变量名 + 默认值
 * 3. 在 .env.example 中补对应变量
 */

/** 所有受 feature flag 守护的功能键。新增 flag 时在此登记。 */
export type FlagKey = 'event_connectors';

/** 单个 flag 的 env 配置：开关变量名 + 灰度百分比变量名 + 默认值。 */
interface FlagEnvConfig {
  /** 控制 flag 开/关的 env 变量名 */
  enabledVar: string;
  /** 控制灰度百分比（0-100）的 env 变量名 */
  rolloutVar: string;
  /** env 未设置时的默认开关（保守默认为 false） */
  defaultEnabled: boolean;
}

const FLAG_ENV: Record<FlagKey, FlagEnvConfig> = {
  event_connectors: {
    enabledVar: 'FEATURE_EVENT_CONNECTORS',
    rolloutVar: 'FEATURE_EVENT_CONNECTORS_ROLLOUT_PERCENT',
    defaultEnabled: false,
  },
};

/**
 * 把字符串（通常是 userId）映射到 0-99 的稳定整数桶。
 * 同一输入永远得到同一桶号 —— 保证灰度分桶稳定，不会"刷新一下就变"。
 * 使用简单哈希（djb2 变体），不涉及加密强度，仅供分桶。
 */
function hashToBucket(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0x7fffffff;
  }
  return hash % 100;
}

export class FeatureFlagService {
  /**
   * 判断某个 flag 是否对指定用户开启。
   *
   * - 若 flag 整体关闭（enabled=false）→ 永远返回 false
   * - 若 flag 开启但未传 userId → 仅看 rolloutPercent 是否为 100（无用户无法稳定分桶，保守返回 false）
   * - 若 flag 开启且传了 userId → 该用户落入 [0, rolloutPercent) 桶则开启
   *
   * @param key    flag 键名
   * @param userId 用户 ID（可选）；传则按桶灰度，不传则仅 rolloutPercent=100 时为 true
   */
  static isEnabled(key: FlagKey, userId?: string): boolean {
    const cfg = FLAG_ENV[key];

    const enabled =
      (process.env[cfg.enabledVar] || '').toLowerCase() === 'true' || cfg.defaultEnabled;
    if (!enabled) return false;

    const rolloutPercent = Math.max(
      0,
      Math.min(100, Number(process.env[cfg.rolloutVar] || 0)),
    );
    if (rolloutPercent >= 100) return true;

    // 无 userId 无法稳定分桶：保守起见，仅在全量时放行
    if (!userId) return false;

    return hashToBucket(userId) < rolloutPercent;
  }

  /**
   * 返回 flag 的详细状态，供调试 / 管理端展示。
   */
  static describe(key: FlagKey, userId?: string) {
    const cfg = FLAG_ENV[key];
    const enabled =
      (process.env[cfg.enabledVar] || '').toLowerCase() === 'true' || cfg.defaultEnabled;
    const rolloutPercent = Math.max(
      0,
      Math.min(100, Number(process.env[cfg.rolloutVar] || 0)),
    );
    return {
      key,
      enabled,
      rolloutPercent,
      bucket: userId ? hashToBucket(userId) : null,
      active: this.isEnabled(key, userId),
    };
  }
}
