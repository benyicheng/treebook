import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  /** 顶部图标，传入 lucide 图标组件 */
  icon?: React.ElementType;
  /** 主标题 */
  title: string;
  /** 描述文字 */
  description?: string;
  /** 可选操作按钮 */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** 紧凑模式（内嵌于卡片时使用） */
  compact?: boolean;
}

/**
 * 通用空状态组件，统一全项目散落的"暂无XX"内联文案。
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}) => {
  return (
    <div className={`text-center ${compact ? 'py-8' : 'py-16'}`}>
      {Icon && (
        <Icon
          size={compact ? 32 : 56}
          className="mx-auto text-ink-300 dark:text-ink-600 mb-3 opacity-60"
        />
      )}
      <p className={`font-black text-ink-500 dark:text-ink-400 ${compact ? 'text-sm' : 'text-lg'}`}>
        {title}
      </p>
      {description && (
        <p className={`text-ink-400 mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          {description}
        </p>
      )}
      {action && (
        <Button size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
