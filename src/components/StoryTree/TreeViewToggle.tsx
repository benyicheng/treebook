import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Target, GitBranch, type LucideIcon } from 'lucide-react';

export type ViewMode = 'panorama' | 'focus' | 'path';

interface TreeViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const modes: { value: ViewMode; label: string; Icon: LucideIcon }[] = [
  { value: 'panorama', label: '全景图', Icon: Globe },
  { value: 'focus', label: '焦点图', Icon: Target },
  { value: 'path', label: '路径', Icon: GitBranch },
];

const TreeViewToggle: React.FC<TreeViewToggleProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-1 bg-ink-50 dark:bg-ink-700/80 p-1 rounded-xl">
      {modes.map(({ value: mode, label, Icon }) => {
        const isActive = value === mode;
        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              isActive
                ? 'text-white'
                : 'text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-white'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="toggle-bg"
                className="absolute inset-0 bg-accent-500 rounded-lg"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <Icon size={14} className="relative z-10" />
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TreeViewToggle;
