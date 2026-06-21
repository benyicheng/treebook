/**
 * Event Connector Bar — 6 格徽标条
 *
 * 显示在事件卡底部，展示六向连接器的计数：
 *   📖 1   👥 3   📍 0   🌿 2   ✨ 1   🛤 4
 *
 * 视觉规则：
 * - count=0 灰显（不可点击）
 * - count>0 着色（可点击展开 InlineGrid）
 * - 当前激活的格子加底色高亮
 */

import React from 'react';
import { CONNECTOR_META } from './eventConnectorMeta';
import type { EventConnectors, ConnectorKey } from '../../../api/eventConnectorService';

interface EventConnectorBarProps {
  connectors: EventConnectors;
  /** 当前激活的连接器（用户已点击展开），未激活时为 null */
  activeKey: ConnectorKey | null;
  /** 点击徽标：传入 key，或 null 表示折叠当前激活项 */
  onSelect: (key: ConnectorKey | null) => void;
}

const EventConnectorBar: React.FC<EventConnectorBarProps> = ({
  connectors,
  activeKey,
  onSelect,
}) => {
  return (
    <div
      className="flex items-center gap-1 flex-wrap"
      role="toolbar"
      aria-label="事件连接器"
    >
      {CONNECTOR_META.map((meta) => {
        const summary = connectors[meta.key];
        const count = summary.count;
        const isActive = activeKey === meta.key;
        const isEmpty = count === 0;

        return (
          <button
            key={meta.key}
            type="button"
            disabled={isEmpty}
            aria-label={`${meta.label} ${count} 个`}
            aria-pressed={isActive}
            onClick={() => onSelect(isActive ? null : meta.key)}
            className={[
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium transition-colors',
              isEmpty
                ? 'text-ink-300 dark:text-ink-500 cursor-default'
                : isActive
                  ? 'bg-ink-100 dark:bg-ink-600 ring-1 ring-ink-200 dark:ring-ink-500 ' + meta.accentClass
                  : 'hover:bg-ink-50 dark:hover:bg-ink-600/50 ' + meta.accentClass,
            ].join(' ')}
          >
            <span aria-hidden="true">{meta.icon}</span>
            <span aria-hidden="true">{count}</span>
          </button>
        );
      })}
    </div>
  );
};

export default EventConnectorBar;
