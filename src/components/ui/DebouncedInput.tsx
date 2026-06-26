import React, { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

interface DebouncedInputProps {
  /** 受控初始值 */
  value?: string;
  /** 防抖结束后触发的回调 */
  onChange: (value: string) => void;
  /** 防抖延迟（毫秒），默认 300 */
  delay?: number;
  placeholder?: string;
  /** 是否显示左侧搜索图标，默认 true */
  showIcon?: boolean;
  /** 自定义输入框 className */
  className?: string;
  autoFocus?: boolean;
}

/**
 * 内置防抖的受控输入框，统一全项目散落的手写 setTimeout 防抖逻辑。
 * 用户输入时立即更新本地显示值，停止输入 delay 毫秒后才触发 onChange。
 */
const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value: externalValue = '',
  onChange,
  delay = 300,
  placeholder,
  showIcon = true,
  className = '',
  autoFocus = false,
}) => {
  const [internalValue, setInternalValue] = useState(externalValue);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // 外部 value 变化时同步内部（例如父组件手动清空）
  useEffect(() => {
    setInternalValue(externalValue);
  }, [externalValue]);

  // 卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(val), delay);
  };

  return (
    <div className={`relative ${showIcon ? '' : ''}`}>
      {showIcon && (
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
        />
      )}
      <input
        type="text"
        autoFocus={autoFocus}
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full ${showIcon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-accent-400 outline-none transition-all text-sm font-medium ${className}`}
      />
    </div>
  );
};

export default DebouncedInput;
