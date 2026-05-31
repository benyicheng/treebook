import React from 'react';

type SkeletonVariant = 'text' | 'card' | 'avatar' | 'paragraph';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  lines?: number;
}

const baseClasses = 'animate-pulse bg-ink-100 rounded-md';

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  className = '',
  lines = 3,
}) => {
  if (variant === 'card') {
    return (
      <div className={`${baseClasses} w-full aspect-[16/9] ${className}`} role="status" aria-label="Loading" />
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={`${baseClasses} w-10 h-10 rounded-full ${className}`} role="status" aria-label="Loading" />
    );
  }

  if (variant === 'paragraph') {
    return (
      <div className={`space-y-2 ${className}`} role="status" aria-label="Loading">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
          />
        ))}
      </div>
    );
  }

  // text variant (single line)
  return (
    <div className={`${baseClasses} h-4 w-full ${className}`} role="status" aria-label="Loading" />
  );
};
