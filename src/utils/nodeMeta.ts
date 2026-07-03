import { BookOpen, GitBranch, Sparkles, type LucideIcon } from 'lucide-react';

/**
 * 阅读路径节点元数据
 *
 * 阅读路径 / 轨迹中的节点按类别（章节 / 分支 / 番外）区分图标、配色与标签。
 * 此前 ReadingPathDetailPage 与 ReadingTrailPage 各抄一份，且 TrailPage 版本
 * 缺少 dark 模式色值。统一抽到此处，保证三端一致。
 */

export type NodeCategory = 'chapter' | 'branch' | 'spinoff' | string;

/** 节点类别 → 图标组件 */
export function getNodeIcon(category: NodeCategory): LucideIcon {
  switch (category) {
    case 'chapter':
      return BookOpen;
    case 'branch':
      return GitBranch;
    case 'spinoff':
      return Sparkles;
    default:
      return BookOpen;
  }
}

/**
 * 节点类别 → 配色（含 dark 模式）
 * 用于节点徽章的 text/bg/border 组合类名。
 */
export function getNodeColor(category: NodeCategory): string {
  switch (category) {
    case 'chapter':
      return 'text-accent-500 bg-accent-50 dark:bg-accent-500/15 border-accent-200 dark:border-accent-600';
    case 'branch':
      return 'text-accent-500 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800';
    case 'spinoff':
      return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
    default:
      return 'text-ink-500 bg-ink-50 dark:bg-ink-700 border-ink-200 dark:border-ink-600';
  }
}

/** 节点类别 → 中文标签 */
export function getCategoryLabel(category: NodeCategory): string {
  switch (category) {
    case 'chapter':
      return '章节';
    case 'branch':
      return '分支';
    case 'spinoff':
      return '番外';
    default:
      return category;
  }
}

/**
 * 节点类别 → 阅读链接前缀
 * 与 useReadingContext.buildNodeUrl 保持一致；此处不含 ctx 参数，供只需基础链接的场景。
 */
export function getNodeLinkBase(category: NodeCategory, contentId: string): string {
  switch (category) {
    case 'chapter':
      return `/read/${contentId}`;
    case 'branch':
      return `/branch/${contentId}`;
    case 'spinoff':
      return `/spinoff/${contentId}`;
    default:
      return `#${contentId}`;
  }
}
