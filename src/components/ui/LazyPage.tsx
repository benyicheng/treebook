import React, { Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyPageProps {
  component: React.LazyExoticComponent<ComponentType<any>>;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-ink-400">
      <Loader2 size={28} className="animate-spin text-accent-500" />
      <span className="text-xs font-bold">加载中...</span>
    </div>
  </div>
);

/**
 * 懒加载页面包装器 — 统一处理 Suspense + 错误边界场景
 * 用法: <LazyPage component={lazy(() => import('./pages/Home'))} />
 */
const LazyPage: React.FC<LazyPageProps> = ({ component: Component, fallback }) => (
  <Suspense fallback={fallback ?? <DefaultFallback />}>
    <Component />
  </Suspense>
);

export default LazyPage;
