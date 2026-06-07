import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../../lib/analytics';

/**
 * 自动追踪 page_view 和 session_start
 * 放在 Router 内部，监听位置变化
 */
export default function AnalyticsTracker() {
  const location = useLocation();
  const hasTrackedSession = useRef(false);

  // session_start — 仅首次挂载时触发
  useEffect(() => {
    if (!hasTrackedSession.current) {
      hasTrackedSession.current = true;
      analytics.trackSessionStart();
    }
  }, []);

  // page_view — 每次路由变化时触发
  useEffect(() => {
    analytics.trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null; // 无 UI
}
