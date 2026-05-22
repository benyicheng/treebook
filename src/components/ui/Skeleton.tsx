import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={clsx('animate-pulse bg-gray-200 dark:bg-gray-700 rounded', className)} />
);

export const SkeletonCard: React.FC = () => (
  <div className="animate-pulse">
    <Skeleton className="aspect-[2/3] rounded-[3px] mb-2.5" />
    <Skeleton className="h-3 w-3/4 mb-1.5" />
    <Skeleton className="h-2.5 w-1/2" />
  </div>
);

export const SkeletonRow: React.FC = () => (
  <div className="flex gap-5 py-3 animate-pulse">
    <Skeleton className="w-20 aspect-[2/3] shrink-0 rounded-[2px]" />
    <div className="flex-1 py-0.5 space-y-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  </div>
);

export const SkeletonLine: React.FC<{ width?: string }> = ({ width }) => (
  <Skeleton className={clsx('h-2.5', width || 'w-full')} />
);
