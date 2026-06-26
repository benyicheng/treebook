import React, { useState, useCallback } from 'react';
import Modal from '../ui/Modal';
import { useThemeStore, type ThemeMode } from '../../stores/useThemeStore';

export type FontMode = 'serif' | 'sans';

export interface ReadingSettingsState {
  fontSize: number;
  themeMode: ThemeMode;
  fontFamily: FontMode;
}

interface ReadingSettingsProps {
  variant: 'modal' | 'inline';
  isOpen: boolean;
  onClose: () => void;
  onChange?: (settings: ReadingSettingsState) => void;
}

const STORAGE_KEYS = {
  fontSize: 'readFontSize',
  theme: 'readTheme',
  font: 'readFont',
} as const;

const FONT_SIZE_RANGE = { min: 14, max: 28, step: 2 };

function loadInitial(): ReadingSettingsState {
  return {
    fontSize: Number(localStorage.getItem(STORAGE_KEYS.fontSize)) || 18,
    themeMode: (localStorage.getItem(STORAGE_KEYS.theme) as ThemeMode) || 'auto',
    fontFamily: (localStorage.getItem(STORAGE_KEYS.font) as FontMode) || 'serif',
  };
}

function persistFont(settings: { fontSize: number; fontFamily: FontMode }): void {
  localStorage.setItem(STORAGE_KEYS.fontSize, String(settings.fontSize));
  localStorage.setItem(STORAGE_KEYS.font, settings.fontFamily);
}

const SettingsControls: React.FC<{
  settings: { fontSize: number; themeMode: ThemeMode; fontFamily: FontMode };
  onUpdate: (patch: Partial<{ fontSize: number; themeMode: ThemeMode; fontFamily: FontMode }>) => void;
}> = ({ settings, onUpdate }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-ink-400 uppercase tracking-wider">字号</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpdate({ fontSize: Math.max(FONT_SIZE_RANGE.min, settings.fontSize - FONT_SIZE_RANGE.step) })}
            disabled={settings.fontSize <= FONT_SIZE_RANGE.min}
            className="w-8 h-8 rounded-md border border-ink-200 flex items-center justify-center text-sm text-ink-500 hover:bg-ink-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-instant"
            aria-label="缩小字号"
          >
            A−
          </button>
          <div className="flex-1 h-1.5 bg-ink-100 rounded-full relative">
            <div
              className="absolute top-0 left-0 h-full bg-accent-500 rounded-full transition-all duration-normal ease-out-expo"
              style={{
                width: `${((settings.fontSize - FONT_SIZE_RANGE.min) / (FONT_SIZE_RANGE.max - FONT_SIZE_RANGE.min)) * 100}%`,
              }}
            />
          </div>
          <button
            onClick={() => onUpdate({ fontSize: Math.min(FONT_SIZE_RANGE.max, settings.fontSize + FONT_SIZE_RANGE.step) })}
            disabled={settings.fontSize >= FONT_SIZE_RANGE.max}
            className="w-8 h-8 rounded-md border border-ink-200 flex items-center justify-center text-sm text-ink-500 hover:bg-ink-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-instant"
            aria-label="放大字号"
          >
            A+
          </button>
          <span className="text-xs text-ink-400 w-8 text-right tabular-nums">{settings.fontSize}px</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-ink-400 uppercase tracking-wider">主题</span>
        <div className="flex gap-2">
          {([
            { value: 'light' as ThemeMode, label: '浅色', icon: '☀️' },
            { value: 'dark' as ThemeMode, label: '深色', icon: '🌙' },
            { value: 'auto' as ThemeMode, label: '自动', icon: '⚙️' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdate({ themeMode: opt.value })}
              className={
                `flex-1 h-9 rounded-md text-xs font-medium transition-all duration-instant ease-out-expo border ` +
                `${settings.themeMode === opt.value
                  ? 'bg-accent-50 border-accent-300 text-accent-600'
                  : 'bg-white border-ink-200 text-ink-500 hover:bg-ink-50'
                }`
              }
            >
              <span className="mr-1">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-ink-400 uppercase tracking-wider">字体</span>
        <div className="flex gap-2">
          {([
            { value: 'serif' as FontMode, label: '衬线', preview: 'font-reading' },
            { value: 'sans' as FontMode, label: '无衬线', preview: 'font-ui' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdate({ fontFamily: opt.value })}
              className={
                `flex-1 h-12 rounded-md text-sm font-medium transition-all duration-instant ease-out-expo border ` +
                `${settings.fontFamily === opt.value
                  ? 'bg-accent-50 border-accent-300 text-accent-600'
                  : 'bg-white border-ink-200 text-ink-500 hover:bg-ink-50'
                }`}
            >
              <span className={`${opt.preview} text-base`}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ReadingSettings: React.FC<ReadingSettingsProps> = ({
  variant,
  isOpen,
  onClose,
  onChange,
}) => {
  const { themeMode, setThemeMode } = useThemeStore();
  const [fontSettings, setFontSettings] = useState<{ fontSize: number; fontFamily: FontMode }>(() => ({
    fontSize: Number(localStorage.getItem(STORAGE_KEYS.fontSize)) || 18,
    fontFamily: (localStorage.getItem(STORAGE_KEYS.font) as FontMode) || 'serif',
  }));

  const handleUpdate = useCallback(
    (patch: Partial<{ fontSize: number; themeMode: ThemeMode; fontFamily: FontMode }>) => {
      if ('themeMode' in patch && patch.themeMode !== undefined) {
        setThemeMode(patch.themeMode);
      }
      if ('fontSize' in patch || 'fontFamily' in patch) {
        setFontSettings((prev) => {
          const next = { ...prev, ...patch };
          persistFont(next);
          onChange?.({ ...next, themeMode });
          return next;
        });
      }
    },
    [onChange, setThemeMode, themeMode]
  );

  const settings = { ...fontSettings, themeMode };

  if (variant === 'inline') {
    if (!isOpen) return null;
    return (
      <div
        className="border-b border-ink-100 bg-ink-50/80 backdrop-blur-sm px-4 py-3 overflow-hidden"
        style={{
          animation: 'reading-settings-in 200ms cubic-bezier(0.25, 1, 0.5, 1) forwards',
        }}
      >
        <SettingsControls settings={settings} onUpdate={handleUpdate} />
        <style>{`
          @keyframes reading-settings-in {
            from { max-height: 0; opacity: 0; }
            to   { max-height: 300px; opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="阅读设置">
      <div className="p-6">
        <SettingsControls settings={settings} onUpdate={handleUpdate} />
      </div>
    </Modal>
  );
};

export { loadInitial, STORAGE_KEYS };
