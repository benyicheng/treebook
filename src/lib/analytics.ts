/**
 * 前端埋点 SDK
 *
 * 5 个核心事件：
 * - page_view        页面浏览（自动追踪）
 * - session_start    会话开始（自动追踪）
 * - reading_progress 阅读进度（需手动调用）
 * - content_created  内容创作（需手动调用）
 * - search_performed 搜索执行（需手动调用）
 */

const ENDPOINT = '/api/analytics/events';
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 5000; // 5s
const SESSION_ID = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

type EventProperties = Record<string, unknown>;

interface PendingEvent {
  type: string;
  targetType?: string;
  targetId?: string;
  properties?: EventProperties;
  timestamp: string;
}

let queue: PendingEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL);
}

async function flush() {
  if (queue.length === 0) return;

  const batch = queue.splice(0, BATCH_SIZE);
  const remaining = queue.splice(0); // drain rest
  queue = [];

  const payload = [...batch, ...remaining];

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ events: payload })], { type: 'application/json' });
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: payload }),
      });
    }
  } catch {
    // 埋点失败静默，不影响用户体验
  }
}

function enqueue(event: Omit<PendingEvent, 'timestamp'>) {
  queue.push({ ...event, timestamp: new Date().toISOString() });

  if (queue.length >= BATCH_SIZE) {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    flush();
  } else {
    scheduleFlush();
  }
}

// 页面卸载时强制发送
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (queue.length > 0) {
      flush();
    }
  });

  window.addEventListener('pagehide', () => {
    if (queue.length > 0) {
      flush();
    }
  });
}

// ─── 公共 API ───────────────────────────────────────────

export const analytics = {
  /** 页面浏览 — 路由切换时调用 */
  trackPageView(pathname: string, referrer?: string) {
    enqueue({
      type: 'page_view',
      targetType: 'page',
      targetId: pathname,
      properties: {
        referrer: referrer || document.referrer || '',
        sessionId: SESSION_ID,
      },
    });
  },

  /** 会话开始 — 首次加载时调用 */
  trackSessionStart() {
    enqueue({
      type: 'session_start',
      targetType: 'system',
      targetId: SESSION_ID,
      properties: {
        userAgent: navigator.userAgent.slice(0, 256),
        screenSize: `${window.screen.width}x${window.screen.height}`,
      },
    });
  },

  /** 阅读进度 — 阅读章节时调用 */
  trackReadingProgress(chapterId: string, storyId: string, progress: number) {
    enqueue({
      type: 'reading_progress',
      targetType: 'chapter',
      targetId: chapterId,
      properties: { storyId, progress: Math.round(progress) },
    });
  },

  /** 内容创作 — 发布故事/章节/分支/番外时调用 */
  trackContentCreated(type: 'story' | 'chapter' | 'branch' | 'spinoff', id: string) {
    enqueue({
      type: 'content_created',
      targetType: type,
      targetId: id,
    });
  },

  /** 搜索 — 执行搜索时调用 */
  trackSearch(query: string, resultCount: number, filters?: string[]) {
    enqueue({
      type: 'search_performed',
      targetType: 'search',
      targetId: query.slice(0, 100),
      properties: { resultCount, filters },
    });
  },
};

export default analytics;
