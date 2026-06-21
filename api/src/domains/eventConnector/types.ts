/**
 * Event Card Six-direction Connector — 类型定义
 *
 * 六向连接器把一个"事件"变成故事图谱的可探索坐标：
 *   📖 章节  👥 角色  📍 地点(Wiki)  🌿 分支  ✨ 番外  🛤 阅读路径
 *
 * 数据流：EventConnectorRepo（6 路原子 query）
 *       → EventConnectorAssembler（合并为 Map<eventId, EventConnectors>）
 *       → EventConnectorService（编排 + 装配到 EventCardDTO[]）
 *
 * 注意：StoryEvent 无 chapterId 字段，与章节的关系通过 StoryEventNode
 * （targetType='chapter'）间接关联。fallback 策略据此设计。
 */

/** 单连接器的摘要：总数 + top-N 预览项。 */
export interface ConnectorSummary<T> {
  count: number;
  preview: T[];
}

/** 📖 章节预览（一个事件可关联多个章节节点） */
export interface ChapterPreview {
  id: string;
  title: string;
  /** 章节在所属分支/主线中的序号 */
  orderIndex: number | null;
  storyId: string | null;
  /** 该章节所属分支 id（主线为 null） */
  branchId: string | null;
}

/** 👥 角色预览 */
export interface CharacterPreview {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  /** 出场类型，用于排序：main_focus 优先 */
  appearanceType: string;
}

/** 📍 Wiki 预览（地点/物品/概念等） */
export interface WikiPreview {
  id: string;
  title: string;
  contentType: string;
}

/** 🌿 分支预览 */
export interface BranchPreview {
  id: string;
  title: string;
  branchType: string;
  /** 分支包含章节数（粗略，便于用户判断分支规模） */
  chapterCount: number;
}

/** ✨ 番外预览 */
export interface SpinoffPreview {
  id: string;
  title: string;
  type: string;
  isOfficial: boolean;
}

/** 🛤 阅读路径预览 */
export interface ReadingPathPreview {
  id: string;
  title: string;
  /** 路径来源：official 官方 / user 用户 / system 系统 */
  origin: string;
}

/** 六向连接器的完整摘要结构 */
export interface EventConnectors {
  /** 📖 章节：单值语义不成立（事件可跨多章），用 ConnectorSummary 统一形态 */
  chapters: ConnectorSummary<ChapterPreview>;
  /** 👥 角色 */
  characters: ConnectorSummary<CharacterPreview>;
  /** 📍 地点/Wiki */
  wiki: ConnectorSummary<WikiPreview>;
  /** 🌿 分支 */
  branches: ConnectorSummary<BranchPreview>;
  /** ✨ 番外 */
  spinoffs: ConnectorSummary<SpinoffPreview>;
  /** 🛤 阅读路径 */
  readingPaths: ConnectorSummary<ReadingPathPreview>;
}

/** 事件卡 DTO —— 前端 EventCard 渲染所需的最小完整数据 */
export interface EventCardDTO {
  id: string;
  storyId: string;
  title: string;
  description: string | null;
  /** 事件在故事中的排序序号（来自 StoryEvent.sortOrder） */
  sortOrder: number;
  type: string;
  importance: number;
  color: string | null;
  /** 是否为分支点（事件关联了 branch 类型节点则视为分支点） */
  isBranchPoint: boolean;
  connectors: EventConnectors;
}

/** 6 个连接器键名的字面量联合，用于遍历/校验 */
export type ConnectorKey = keyof EventConnectors;

// ── Phase 4: 分支对比 DTO ────────────────────────────────────────────

/** 分支对比中的一章预览 */
export interface BranchComparisonChapter {
  id: string;
  title: string;
  orderIndex: number;
}

/** 分支对比中的一条"轨道"（主线或某个分支） */
export interface BranchComparisonTrack {
  /** 'main' 表示主线；分支则为 branch id */
  id: string;
  /** 'main' | 'branch' */
  kind: 'main' | 'branch';
  title: string;
  /** 前 N 章预览（默认 3） */
  previewChapters: BranchComparisonChapter[];
  /** 该轨道总章节数 */
  totalChapters: number;
  /** 统计：阅读数 / 平均评分（可能为 null，表示无数据） */
  stats: {
    readCount: number | null;
    averageRating: number | null;
  };
}

/** 分支对比响应：主线 + 各分支轨道 */
export interface BranchComparisonDTO {
  /** 触发对比的事件 ID */
  eventId: string;
  /** 主线轨道 */
  main: BranchComparisonTrack;
  /** 分支轨道列表（不含主线） */
  branches: BranchComparisonTrack[];
}

// ── Phase 4: 路径叉路 DTO ────────────────────────────────────────────

/** 路径叉路创建结果 */
export interface ForkPathResultDTO {
  pathId: string;
  /** 新建的叉路分组 ID */
  forkGroupId: string;
  /** 该组内新增的节点数 */
  addedNodes: number;
}
