/**
 * 前端 Feature Flag 读取
 *
 * 与后端 FeatureFlagService 配对：
 * - 后端是真正的守门人（决定是否返回数据）
 * - 前端 flag 决定是否"调用接口 + 渲染 UI"，避免无谓请求
 *
 * 前端 flag 关闭时：
 * - 完全不调用 /api/events/connectors
 * - UI 退回到原始事件卡（与功能上线前逐字节一致）
 *
 * Vite 在构建时把 import.meta.env.VITE_* 替换为字面量字符串，
 * 因此 flag 切换需要重新构建/重启 dev server（与生产环境的 env 一致）。
 */

/** 所有受 flag 守护的功能键。新增时同步 .env.example。 */
export type FrontendFlagKey = 'event_connectors';

const FLAG_ENV_VAR: Record<FrontendFlagKey, string> = {
  event_connectors: 'VITE_FEATURE_EVENT_CONNECTORS',
};

/**
 * 读取前端 flag 是否开启。
 * 仅检查 env 变量为字符串 "true"（大小写不敏感），其他视为关闭。
 */
export function isFrontendFlagEnabled(key: FrontendFlagKey): boolean {
  const varName = FLAG_ENV_VAR[key];
  // import.meta.env 在构建期被静态替换；动态读取 key 名也安全（Vite 5 起支持）
  const raw = (import.meta.env as Record<string, string | undefined>)[varName];
  return (raw ?? '').toLowerCase() === 'true';
}
