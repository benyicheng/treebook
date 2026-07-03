import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ElementType;
  /** 可选右上角计数 */
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  /** underline（默认）或 pill 两种视觉 */
  variant?: 'underline' | 'pill';
  className?: string;
}

/**
 * Tabs — 统一的受控标签页导航（键盘方向键可达）
 *
 * 替代散落的自定义 tab 条实现，统一活跃态、hover 与无障碍语义。
 */
const Tabs: React.FC<TabsProps> = ({
  items,
  value,
  onChange,
  variant = 'underline',
  className,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = (index + dir + items.length) % items.length;
    onChange(items[next].value);
  };

  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1',
        variant === 'underline'
          ? 'border-b border-ink-100 dark:border-ink-700'
          : 'p-1 rounded-xl bg-ink-100 dark:bg-ink-700/50',
        className
      )}
    >
      {items.map((item, i) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              'inline-flex items-center gap-2 font-semibold text-sm transition-all duration-fast outline-none',
              'focus-visible:ring-2 focus-visible:ring-accent-500/40',
              variant === 'underline'
                ? cn(
                    'px-4 py-3 -mb-px border-b-2',
                    active
                      ? 'border-accent-500 text-accent-600 dark:text-accent-400'
                      : 'border-transparent text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'
                  )
                : cn(
                    'px-4 py-2 rounded-lg flex-1 justify-center',
                    active
                      ? 'bg-white dark:bg-ink-800 text-ink-800 dark:text-ink-100 shadow-sm'
                      : 'text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'
                  )
            )}
          >
            {Icon && <Icon size={16} />}
            {item.label}
            {typeof item.count === 'number' && (
              <span
                className={cn(
                  'text-xs px-1.5 rounded-full',
                  active
                    ? 'bg-accent-100 dark:bg-accent-500/20 text-accent-600 dark:text-accent-400'
                    : 'bg-ink-100 dark:bg-ink-700 text-ink-500'
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
