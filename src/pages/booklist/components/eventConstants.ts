/**
 * 事件共享常量 — 单一来源，供 CreateEventModal / EventEditModal / EventDetailDrawer / BooklistEventCard 引用。
 * 与后端 enums.ts 的 STORY_EVENT_TYPES 保持同步。
 */

export const EVENT_TYPES = [
  { value: 'main_arc', label: '主线' },
  { value: 'side_story', label: '支线' },
  { value: 'character_event', label: '角色事件' },
  { value: 'world_event', label: '世界事件' },
  { value: 'climax', label: '高潮' },
  { value: 'turning_point', label: '转折点' },
  { value: 'flashback', label: '回忆/倒叙' },
  { value: 'foreshadowing', label: '伏笔' },
] as const;

export const EVENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  EVENT_TYPES.map(t => [t.value, t.label]),
);

export const EVENT_COLORS = [
  '#f43f5e', '#e11d48', '#be123c',
  '#f97316', '#ea580c', '#d97706',
  '#eab308', '#65a30d', '#16a34a',
  '#06b6d4', '#0284c7', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef',
  '#78716c', '#64748b', '#1e293b',
] as const;
