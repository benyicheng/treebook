/**
 * Event Connector — 6 个连接器的图标 / 标签 / 颜色配置
 *
 * 单一来源：Bar 与 InlineGrid 共享，避免风格漂移。
 */

import React from 'react';
import {
  BookOpen,
  Users,
  MapPin,
  GitBranch,
  Sparkles,
  Map as MapIcon,
} from 'lucide-react';
import type { ConnectorKey } from '../../../api/eventConnectorService';

export interface ConnectorMeta {
  key: ConnectorKey;
  icon: React.ReactNode;
  label: string;
  /** 计数 > 0 时徽标的强调色（Tailwind 类名） */
  accentClass: string;
}

/**
 * 6 向连接器元数据（顺序即 UI 上的展示顺序）：
 * 📖 章节 → 👥 角色 → 📍 地点(Wiki) → 🌿 分支 → ✨ 番外 → 🛤 路径
 */
export const CONNECTOR_META: ConnectorMeta[] = [
  {
    key: 'chapters',
    icon: <BookOpen size={12} />,
    label: '章节',
    accentClass: 'text-sky-600 dark:text-sky-400',
  },
  {
    key: 'characters',
    icon: <Users size={12} />,
    label: '角色',
    accentClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'wiki',
    icon: <MapPin size={12} />,
    label: '地点',
    accentClass: 'text-violet-600 dark:text-violet-400',
  },
  {
    key: 'branches',
    icon: <GitBranch size={12} />,
    label: '分支',
    accentClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'spinoffs',
    icon: <Sparkles size={12} />,
    label: '番外',
    accentClass: 'text-pink-600 dark:text-pink-400',
  },
  {
    key: 'readingPaths',
    icon: <MapIcon size={12} />,
    label: '路径',
    accentClass: 'text-indigo-600 dark:text-indigo-400',
  },
];
