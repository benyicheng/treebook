import React from 'react';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  variant?: 'inline' | 'overlay' | 'page';
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  text,
  variant = 'inline',
}) => {
  const sizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const strokeWidth = {
    small: 2,
    medium: 2,
    large: 2.5,
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  const textSpacingClasses = {
    small: 'ml-2',
    medium: 'ml-3',
    large: 'ml-4',
  };

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 bg-white/90 dark:bg-ink-800/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            className={`${sizeClasses[size]} text-accent-500 animate-spin`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth[size]}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {text && (
            <p className={`${textSizeClasses[size]} font-medium text-ink-600 dark:text-ink-300`}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            className={`${sizeClasses.large} text-accent-500 animate-spin`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth.large}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {text && (
            <p className={`${textSizeClasses.medium} font-medium text-ink-500 dark:text-ink-400`}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <svg
        className={`${sizeClasses[size]} text-accent-500 animate-spin`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth[size]}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && (
        <span className={`${textSizeClasses[size]} ${textSpacingClasses[size]} font-medium text-ink-500 dark:text-ink-400`}>
          {text}
        </span>
      )}
    </div>
  );
};

export default Loading;
