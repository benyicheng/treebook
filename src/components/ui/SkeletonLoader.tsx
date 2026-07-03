import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-ink-100 dark:bg-ink-700 rounded-lg ${className}`} />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-ink-50 dark:bg-ink-800 rounded-2xl p-5 border border-ink-200 dark:border-ink-700">
      <div className="flex gap-4">
        <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonHeroBanner: React.FC = () => {
  return (
    <div className="bg-ink-100 dark:bg-ink-700 rounded-2xl h-64 w-full animate-pulse" />
  );
};

export const SkeletonBooklistCard: React.FC = () => {
  return (
    <div className="bg-ink-50 dark:bg-ink-800 rounded-2xl overflow-hidden border border-ink-200 dark:border-ink-700">
      <Skeleton className="h-40 w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonStoryCard: React.FC = () => {
  return (
    <div className="bg-ink-50 dark:bg-ink-800 rounded-xl overflow-hidden border border-ink-200 dark:border-ink-700">
      <div className="aspect-video w-full">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-2 mt-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStoryCard key={i} />
      ))}
    </div>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default Skeleton;
