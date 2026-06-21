import client from './client';

/**
 * Event Card Six-direction Connector — 前端 API 客户端
 *
 * 对接 GET /api/events/connectors?ids=uuid1,uuid2,...
 * 后端在 flag 关闭时返回 503 + FEATURE_DISABLED；调用方应 catch 后降级。
 */

// ── DTO 类型（与后端 api/src/domains/eventConnector/types.ts 保持同步）──

export interface ConnectorSummary<T> {
  count: number;
  preview: T[];
}

export interface ChapterPreview {
  id: string;
  title: string;
  orderIndex: number | null;
  storyId: string | null;
  branchId: string | null;
}

export interface CharacterPreview {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  appearanceType: string;
}

export interface WikiPreview {
  id: string;
  title: string;
  contentType: string;
}

export interface BranchPreview {
  id: string;
  title: string;
  branchType: string;
  chapterCount: number;
}

export interface SpinoffPreview {
  id: string;
  title: string;
  type: string;
  isOfficial: boolean;
}

export interface ReadingPathPreview {
  id: string;
  title: string;
  origin: string;
}

export interface EventConnectors {
  chapters: ConnectorSummary<ChapterPreview>;
  characters: ConnectorSummary<CharacterPreview>;
  wiki: ConnectorSummary<WikiPreview>;
  branches: ConnectorSummary<BranchPreview>;
  spinoffs: ConnectorSummary<SpinoffPreview>;
  readingPaths: ConnectorSummary<ReadingPathPreview>;
}

export interface EventCardDTO {
  id: string;
  storyId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  type: string;
  importance: number;
  color: string | null;
  isBranchPoint: boolean;
  connectors: EventConnectors;
}

export interface EventConnectorsResponse {
  items: EventCardDTO[];
  total: number;
}

/** 6 个连接器键名联合，供 UI 遍历/校验 */
export type ConnectorKey = keyof EventConnectors;

export const CONNECTOR_KEYS: ConnectorKey[] = [
  'chapters',
  'characters',
  'wiki',
  'branches',
  'spinoffs',
  'readingPaths',
];

// ── API ──────────────────────────────────────────────────────────────

/**
 * 批量获取事件六向连接器摘要。
 * @param eventIds 事件 ID 列表（上限 50，由后端 zod 校验）
 * @throws 503 FEATURE_DISABLED — flag 未开启；调用方应 catch 后降级
 * @throws 400 VALIDATION_ERROR — ids 为空或超限
 */
export async function fetchEventConnectors(eventIds: string[]): Promise<EventConnectorsResponse> {
  if (eventIds.length === 0) {
    return { items: [], total: 0 };
  }
  // 响应拦截器已展开 { success, data } → 直接拿到 { items, total }
  const { data } = await client.get<EventConnectorsResponse>('/events/connectors', {
    params: { ids: eventIds.join(',') },
  });
  return data;
}

// ── Phase 4: 分支对比 + 路径叉路 ─────────────────────────────────────

/** 分支对比中的一章预览 */
export interface BranchComparisonChapter {
  id: string;
  title: string;
  orderIndex: number;
}

/** 分支对比中的一条轨道（主线或分支） */
export interface BranchComparisonTrack {
  id: string;
  kind: 'main' | 'branch';
  title: string;
  previewChapters: BranchComparisonChapter[];
  totalChapters: number;
  stats: {
    readCount: number | null;
    averageRating: number | null;
  };
}

/** 分支对比响应 */
export interface BranchComparisonDTO {
  eventId: string;
  main: BranchComparisonTrack;
  branches: BranchComparisonTrack[];
}

/** 路径叉路创建结果 */
export interface ForkPathResult {
  pathId: string;
  forkGroupId: string;
  addedNodes: number;
}

/**
 * 获取某事件的分支对比数据（主线 + 各分支轨道）。
 * @throws 503 FEATURE_DISABLED — flag 未开启
 * @throws 404 — 事件不存在
 */
export async function fetchBranchComparison(eventId: string): Promise<BranchComparisonDTO> {
  const { data } = await client.get<BranchComparisonDTO>(
    `/events/${eventId}/branches/compare`,
  );
  return data;
}

/**
 * 在路径指定事件处插入叉路选择点。
 * @throws 403 — 非路径创建者
 * @throws 404 — 路径或事件不存在
 * @throws 400 — branchOptions 数量非法 / primary 不在 options 内
 */
export async function forkReadingPath(
  pathId: string,
  input: { atEventId: string; branchOptions: string[]; primary: string },
): Promise<ForkPathResult> {
  const { data } = await client.post<ForkPathResult>(`/reading-paths/${pathId}/fork`, input);
  return data;
}
