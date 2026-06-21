/**
 * Event Connector Repository
 *
 * 六向连接器的数据访问层。每个方法都是"批量 + 单趟"的原子查询：
 * 输入 eventIds[]，输出 Map<eventId, ...>，杜绝 N+1。
 *
 * 安全规范（沿用 P1-7）：
 * - 所有 SQL 走 prisma.$queryRaw(Prisma.sql\`...\`)，参数用 Prisma.join() 占位
 * - 绝不字符串拼接用户输入
 * - top-N-per-event 用 ROW_NUMBER() OVER (PARTITION BY ...) 窗口函数
 *
 * fallback 说明（Phase 1，不动 schema）：
 * - 角色按事件节点关联的 chapter/branch/spinoff targetId 反查 CharacterAppearance
 * - 分支/番外按事件的 chapter 节点 targetId 反查
 * - Wiki（📍地点）Phase 1 暂返回空（count=0），Phase 3 用 WikiEntityMention 填充
 */

import { prisma } from '../../prisma';
import { Prisma } from '@prisma/client';
import type {
  ChapterPreview,
  CharacterPreview,
  WikiPreview,
  BranchPreview,
  SpinoffPreview,
  ReadingPathPreview,
} from './types';

/** 每个 event 关联的节点，按 targetType 分组。Assembler 据此串接其他连接器。 */
export interface EventNodeIndex {
  /** eventId → 该事件的 chapter 节点 targetIds */
  chapterTargetIds: Map<string, string[]>;
  /** eventId → 该事件的 branch 节点 targetIds */
  branchTargetIds: Map<string, string[]>;
  /** eventId → 该事件的 spinoff 节点 targetIds */
  spinoffTargetIds: Map<string, string[]>;
}

const PREVIEW_LIMIT = 3;

export class EventConnectorRepo {
  // ── 0. 事件节点索引（其他连接器的 fallback 基础）──────────────────

  /**
   * 批量获取事件节点，按 targetType 分组成 Map。
   * 一次 query 拉全所有节点，内存分组，避免对每个 targetType 各查一次。
   */
  static async getEventNodeIndex(eventIds: string[]): Promise<EventNodeIndex> {
    const index: EventNodeIndex = {
      chapterTargetIds: new Map(),
      branchTargetIds: new Map(),
      spinoffTargetIds: new Map(),
    };
    if (eventIds.length === 0) return index;

    const nodes = await prisma.storyEventNode.findMany({
      where: { eventId: { in: eventIds } },
      select: { eventId: true, targetType: true, targetId: true },
    });

    for (const n of nodes) {
      const bucket =
        n.targetType === 'chapter'
          ? index.chapterTargetIds
          : n.targetType === 'branch'
            ? index.branchTargetIds
            : n.targetType === 'spinoff'
              ? index.spinoffTargetIds
              : null;
      if (!bucket) continue; // 未知 targetType 忽略（向前兼容）
      const arr = bucket.get(n.eventId) ?? [];
      arr.push(n.targetId);
      bucket.set(n.eventId, arr);
    }
    return index;
  }

  // ── 1. 📖 章节连接器 ─────────────────────────────────────────────

  /**
   * 每个事件关联的章节（来自 chapter 类型节点）。
   * 一个事件可关联多个章节，故返回 ConnectorSummary 形态。
   */
  static async getChapterConnectors(
    nodeIndex: EventNodeIndex,
  ): Promise<Map<string, { count: number; preview: ChapterPreview[] }>> {
    const result = new Map<string, { count: number; preview: ChapterPreview[] }>();

    // 先按事件初始化空摘要（保证无节点的事件也有 entries）
    for (const eventId of nodeIndex.chapterTargetIds.keys()) {
      result.set(eventId, { count: 0, preview: [] });
    }

    const allChapterIds = new Set<string>();
    for (const ids of nodeIndex.chapterTargetIds.values()) {
      for (const id of ids) allChapterIds.add(id);
    }
    if (allChapterIds.size === 0) return result;

    const chapters = await prisma.chapter.findMany({
      where: { id: { in: [...allChapterIds] } },
      select: {
        id: true,
        title: true,
        orderIndex: true,
        storyId: true,
        branchId: true,
      },
    });
    const chapterMap = new Map(chapters.map((c) => [c.id, c]));

    for (const [eventId, chapterIds] of nodeIndex.chapterTargetIds) {
      const preview: ChapterPreview[] = [];
      for (const cid of chapterIds.slice(0, PREVIEW_LIMIT)) {
        const c = chapterMap.get(cid);
        if (!c) continue;
        preview.push({
          id: c.id,
          title: c.title,
          orderIndex: c.orderIndex,
          storyId: c.storyId,
          branchId: c.branchId,
        });
      }
      result.set(eventId, { count: chapterIds.length, preview });
    }
    return result;
  }

  // ── 2. 👥 角色连接器 ─────────────────────────────────────────────

  /**
   * 按事件节点关联的 chapter/branch/spinoff targetId 反查角色出场。
   * top-N-per-event：main_focus 优先，再按角色名。
   */
  static async getCharacterConnectors(
    nodeIndex: EventNodeIndex,
  ): Promise<Map<string, { count: number; preview: CharacterPreview[] }>> {
    const result = new Map<string, { count: number; preview: CharacterPreview[] }>();

    // 收集所有事件涉及的 target（章节+分支+番外），用于 CharacterAppearance 查询
    type TargetRef = { targetType: string; targetId: string };
    const eventTargets = new Map<string, TargetRef[]>();
    for (const [eventId, ids] of nodeIndex.chapterTargetIds) {
      eventTargets.set(
        eventId,
        (eventTargets.get(eventId) ?? []).concat(ids.map((targetId) => ({ targetType: 'chapter', targetId }))),
      );
    }
    for (const [eventId, ids] of nodeIndex.branchTargetIds) {
      eventTargets.set(
        eventId,
        (eventTargets.get(eventId) ?? []).concat(ids.map((targetId) => ({ targetType: 'branch', targetId }))),
      );
    }
    for (const [eventId, ids] of nodeIndex.spinoffTargetIds) {
      eventTargets.set(
        eventId,
        (eventTargets.get(eventId) ?? []).concat(ids.map((targetId) => ({ targetType: 'spinoff', targetId }))),
      );
    }

    // 初始化空摘要
    for (const eventId of eventTargets.keys()) {
      result.set(eventId, { count: 0, preview: [] });
    }
    if (eventTargets.size === 0) return result;

    // 构建 (targetType, targetId) → eventId 反查表
    const targetToEvents = new Map<string, Set<string>>();
    for (const [eventId, refs] of eventTargets) {
      for (const r of refs) {
        const key = `${r.targetType}:${r.targetId}`;
        const set = targetToEvents.get(key) ?? new Set<string>();
        set.add(eventId);
        targetToEvents.set(key, set);
      }
    }

    // 批量查所有相关 CharacterAppearance
    const allTargets = [...targetToEvents.keys()];
    const orClauses: { targetType: string; targetId: string }[] = allTargets.map((k) => {
      const [targetType, targetId] = k.split(':');
      return { targetType, targetId };
    });

    if (orClauses.length === 0) return result;

    const appearances = await prisma.characterAppearance.findMany({
      where: { OR: orClauses },
      select: {
        characterId: true,
        targetType: true,
        targetId: true,
        appearanceType: true,
        character: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    // 按 eventId 聚合角色（去重：同一角色在同一事件只算一次）
    const eventCharacters = new Map<string, Map<string, CharacterPreview>>();
    for (const a of appearances) {
      const key = `${a.targetType}:${a.targetId}`;
      const eventIds = targetToEvents.get(key);
      if (!eventIds) continue;
      for (const eventId of eventIds) {
        const charMap = eventCharacters.get(eventId) ?? new Map<string, CharacterPreview>();
        if (!charMap.has(a.character.id)) {
          charMap.set(a.character.id, {
            id: a.character.id,
            name: a.character.name,
            avatarUrl: a.character.avatarUrl,
            role: a.character.role,
            appearanceType: a.appearanceType,
          });
        }
        eventCharacters.set(eventId, charMap);
      }
    }

    // 排序 + 截断 top-N
    const appearanceRank: Record<string, number> = {
      main_focus: 0,
      appears: 1,
      mention: 2,
      cameo: 3,
    };
    for (const [eventId, charMap] of eventCharacters) {
      const sorted = [...charMap.values()].sort((a, b) => {
        const ra = appearanceRank[a.appearanceType] ?? 9;
        const rb = appearanceRank[b.appearanceType] ?? 9;
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name);
      });
      result.set(eventId, {
        count: sorted.length,
        preview: sorted.slice(0, PREVIEW_LIMIT),
      });
    }

    return result;
  }

  // ── 3. 📍 Wiki 连接器 ────────────────────────────────────────────

  /**
   * 通过 WikiEntityMention 表反查事件提及的 wiki 条目。
   * 数据来源：StoryEventService.create/update 时调用 syncEventWikiMentions
   * 解析事件描述中的 [[wiki:slug]] 引用。
   *
   * 排序：mentionType primary > secondary > reference，再按 wiki title。
   */
  static async getWikiConnectors(
    eventIds: string[],
  ): Promise<Map<string, { count: number; preview: WikiPreview[] }>> {
    const result = new Map<string, { count: number; preview: WikiPreview[] }>();
    for (const eventId of eventIds) {
      result.set(eventId, { count: 0, preview: [] });
    }
    if (eventIds.length === 0) return result;

    const mentions = await prisma.wikiEntityMention.findMany({
      where: { eventId: { in: eventIds } },
      select: {
        eventId: true,
        mentionType: true,
        wikiPage: { select: { id: true, title: true, contentType: true } },
      },
    });

    const mentionRank: Record<string, number> = {
      primary: 0,
      secondary: 1,
      reference: 2,
    };

    const eventWiki = new Map<string, Map<string, WikiPreview & { rank: number }>>();
    for (const m of mentions) {
      if (!m.eventId) continue;
      const wMap = eventWiki.get(m.eventId) ?? new Map<string, WikiPreview & { rank: number }>();
      if (!wMap.has(m.wikiPage.id)) {
        wMap.set(m.wikiPage.id, {
          id: m.wikiPage.id,
          title: m.wikiPage.title,
          contentType: m.wikiPage.contentType,
          rank: mentionRank[m.mentionType] ?? 9,
        });
      }
      eventWiki.set(m.eventId, wMap);
    }

    for (const [eventId, wMap] of eventWiki) {
      const sorted = [...wMap.values()].sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return a.title.localeCompare(b.title);
      });
      // 剔除排序辅助字段 rank
      const preview = sorted.slice(0, PREVIEW_LIMIT).map(({ id, title, contentType }) => ({
        id,
        title,
        contentType,
      }));
      result.set(eventId, { count: sorted.length, preview });
    }
    return result;
  }

  // ── 4. 🌿 分支连接器 ────────────────────────────────────────────

  /**
   * 双轨实现（Phase 3）：
   * - 主路：Branch.parentEventId 直接命中事件
   * - Fallback：Branch.parentChapterId 反查事件的 chapter 节点（Phase 1 行为）
   *
   * 同一分支若两路都命中也只算一次（Map 去重）。
   * Fallback 仅取 parentEventId IS NULL 的分支，避免双计。
   */
  static async getBranchConnectors(
    nodeIndex: EventNodeIndex,
  ): Promise<Map<string, { count: number; preview: BranchPreview[] }>> {
    const result = new Map<string, { count: number; preview: BranchPreview[] }>();
    const eventBranches = new Map<string, Map<string, BranchPreview>>();

    // 初始化所有相关事件为空摘要
    const allEventIds = new Set<string>();
    for (const id of nodeIndex.chapterTargetIds.keys()) allEventIds.add(id);
    for (const id of nodeIndex.branchTargetIds.keys()) allEventIds.add(id);
    for (const id of nodeIndex.spinoffTargetIds.keys()) allEventIds.add(id);
    for (const eventId of allEventIds) {
      result.set(eventId, { count: 0, preview: [] });
    }

    // ── 4a. 主路：Branch.parentEventId 直接命中 ───────────────────
    if (allEventIds.size > 0) {
      const directBranches = await prisma.branch.findMany({
        where: { parentEventId: { in: [...allEventIds] } },
        select: {
          id: true,
          title: true,
          branchType: true,
          parentEventId: true,
          _count: { select: { chapters: true } },
        },
      });
      for (const b of directBranches) {
        if (!b.parentEventId) continue;
        const bMap = eventBranches.get(b.parentEventId) ?? new Map<string, BranchPreview>();
        if (!bMap.has(b.id)) {
          bMap.set(b.id, {
            id: b.id,
            title: b.title,
            branchType: b.branchType,
            chapterCount: b._count.chapters,
          });
        }
        eventBranches.set(b.parentEventId, bMap);
      }
    }

    // ── 4b. Fallback：chapter-level 反查（Phase 1 行为）────────────
    const chapterToEvents = new Map<string, Set<string>>();
    for (const [eventId, chapterIds] of nodeIndex.chapterTargetIds) {
      for (const cid of chapterIds) {
        const set = chapterToEvents.get(cid) ?? new Set<string>();
        set.add(eventId);
        chapterToEvents.set(cid, set);
      }
    }
    const allChapterIds = [...chapterToEvents.keys()];
    if (allChapterIds.length > 0) {
      const fallbackBranches = await prisma.branch.findMany({
        // 仅取 parentEventId IS NULL 的分支，避免与主路重复
        where: { parentChapterId: { in: allChapterIds }, parentEventId: null },
        select: {
          id: true,
          title: true,
          branchType: true,
          parentChapterId: true,
          _count: { select: { chapters: true } },
        },
      });
      for (const b of fallbackBranches) {
        const eventIds = chapterToEvents.get(b.parentChapterId);
        if (!eventIds) continue;
        for (const eventId of eventIds) {
          const bMap = eventBranches.get(eventId) ?? new Map<string, BranchPreview>();
          if (!bMap.has(b.id)) {
            bMap.set(b.id, {
              id: b.id,
              title: b.title,
              branchType: b.branchType,
              chapterCount: b._count.chapters,
            });
          }
          eventBranches.set(eventId, bMap);
        }
      }
    }

    // 排序 + top-N（章节数多的在前）
    for (const [eventId, bMap] of eventBranches) {
      const sorted = [...bMap.values()].sort((a, b) => b.chapterCount - a.chapterCount);
      result.set(eventId, {
        count: sorted.length,
        preview: sorted.slice(0, PREVIEW_LIMIT),
      });
    }
    return result;
  }

  // ── 5. ✨ 番外连接器 ────────────────────────────────────────────

  /**
   * 双轨实现（Phase 3）：
   * - 主路：Spinoff.originalEventId 直接命中事件
   * - Fallback：Spinoff.originalChapterId / originalBranchId 反查（Phase 1 行为）
   *
   * Fallback 仅取 originalEventId IS NULL 的番外，避免双计。
   */
  static async getSpinoffConnectors(
    nodeIndex: EventNodeIndex,
  ): Promise<Map<string, { count: number; preview: SpinoffPreview[] }>> {
    const result = new Map<string, { count: number; preview: SpinoffPreview[] }>();
    const eventSpinoffs = new Map<string, Map<string, SpinoffPreview>>();

    // 初始化所有相关事件
    const allEventIds = new Set<string>();
    for (const id of nodeIndex.chapterTargetIds.keys()) allEventIds.add(id);
    for (const id of nodeIndex.branchTargetIds.keys()) allEventIds.add(id);
    for (const id of nodeIndex.spinoffTargetIds.keys()) allEventIds.add(id);
    for (const eventId of allEventIds) {
      result.set(eventId, { count: 0, preview: [] });
    }

    // ── 5a. 主路：Spinoff.originalEventId 直接命中 ────────────────
    if (allEventIds.size > 0) {
      const directSpinoffs = await prisma.spinoff.findMany({
        where: { originalEventId: { in: [...allEventIds] } },
        select: {
          id: true,
          title: true,
          type: true,
          isOfficial: true,
          originalEventId: true,
        },
      });
      for (const s of directSpinoffs) {
        if (!s.originalEventId) continue;
        const sMap = eventSpinoffs.get(s.originalEventId) ?? new Map<string, SpinoffPreview>();
        if (!sMap.has(s.id)) {
          sMap.set(s.id, {
            id: s.id,
            title: s.title,
            type: s.type,
            isOfficial: s.isOfficial,
          });
        }
        eventSpinoffs.set(s.originalEventId, sMap);
      }
    }

    // ── 5b. Fallback：chapter/branch-level 反查（Phase 1 行为）─────
    const targetToEvents = new Map<string, Set<string>>();
    const collect = (ids: Map<string, string[]>, tt: string) => {
      for (const [eventId, targetIds] of ids) {
        for (const tid of targetIds) {
          const key = `${tt}:${tid}`;
          const set = targetToEvents.get(key) ?? new Set<string>();
          set.add(eventId);
          targetToEvents.set(key, set);
        }
      }
    };
    collect(nodeIndex.chapterTargetIds, 'chapter');
    collect(nodeIndex.branchTargetIds, 'branch');

    const chapterIds: string[] = [];
    const branchIds: string[] = [];
    for (const k of targetToEvents.keys()) {
      const [tt, tid] = k.split(':');
      if (tt === 'chapter') chapterIds.push(tid);
      else branchIds.push(tid);
    }

    if (chapterIds.length > 0 || branchIds.length > 0) {
      const fallbackSpinoffs = await prisma.spinoff.findMany({
        where: {
          // 仅取 originalEventId IS NULL 的番外，避免与主路重复
          originalEventId: null,
          OR: [
            ...(chapterIds.length ? [{ originalChapterId: { in: chapterIds } }] : []),
            ...(branchIds.length ? [{ originalBranchId: { in: branchIds } }] : []),
          ],
        },
        select: {
          id: true,
          title: true,
          type: true,
          isOfficial: true,
          originalChapterId: true,
          originalBranchId: true,
        },
      });

      for (const s of fallbackSpinoffs) {
        const keys: string[] = [];
        if (s.originalChapterId) keys.push(`chapter:${s.originalChapterId}`);
        if (s.originalBranchId) keys.push(`branch:${s.originalBranchId}`);
        for (const key of keys) {
          const eventIds = targetToEvents.get(key);
          if (!eventIds) continue;
          for (const eventId of eventIds) {
            const sMap = eventSpinoffs.get(eventId) ?? new Map<string, SpinoffPreview>();
            if (!sMap.has(s.id)) {
              sMap.set(s.id, {
                id: s.id,
                title: s.title,
                type: s.type,
                isOfficial: s.isOfficial,
              });
            }
            eventSpinoffs.set(eventId, sMap);
          }
        }
      }
    }

    // 排序 + top-N（官方在前）
    for (const [eventId, sMap] of eventSpinoffs) {
      const sorted = [...sMap.values()].sort((a, b) => Number(b.isOfficial) - Number(a.isOfficial));
      result.set(eventId, {
        count: sorted.length,
        preview: sorted.slice(0, PREVIEW_LIMIT),
      });
    }
    return result;
  }

  // ── 6. 🛤 阅读路径连接器 ────────────────────────────────────────

  /**
   * 按事件的 eventId 直接反查 ReadingPathNode（已有 FK）。
   */
  static async getReadingPathConnectors(
    eventIds: string[],
  ): Promise<Map<string, { count: number; preview: ReadingPathPreview[] }>> {
    const result = new Map<string, { count: number; preview: ReadingPathPreview[] }>();
    for (const eventId of eventIds) {
      result.set(eventId, { count: 0, preview: [] });
    }
    if (eventIds.length === 0) return result;

    const nodes = await prisma.readingPathNode.findMany({
      where: { eventId: { in: eventIds } },
      select: {
        eventId: true,
        path: { select: { id: true, title: true, origin: true } },
      },
    });

    const eventPaths = new Map<string, Map<string, ReadingPathPreview>>();
    for (const n of nodes) {
      if (!n.eventId || !n.path) continue;
      const pMap = eventPaths.get(n.eventId) ?? new Map<string, ReadingPathPreview>();
      if (!pMap.has(n.path.id)) {
        pMap.set(n.path.id, {
          id: n.path.id,
          title: n.path.title,
          origin: n.path.origin ?? 'user',
        });
      }
      eventPaths.set(n.eventId, pMap);
    }

    for (const [eventId, pMap] of eventPaths) {
      const sorted = [...pMap.values()];
      result.set(eventId, {
        count: sorted.length,
        preview: sorted.slice(0, PREVIEW_LIMIT),
      });
    }
    return result;
  }

  // ── Phase 4: 分支对比 ─────────────────────────────────────────────

  /** 主线/分支轨道的章节数上限（preview） */
  private static readonly COMPARISON_PREVIEW_CHAPTERS = 3;

  /**
   * 取某事件的分支对比数据：主线轨道 + 各分支轨道。
   *
   * 主线判定：事件的 storyId 对应的 Story，其主线章节（branchId IS NULL）。
   * 分支判定：Branch.parentEventId = eventId（主路），
   *           或 Branch.parentChapterId IN (事件的 chapter 节点) 且 parentEventId IS NULL（fallback）。
   *
   * 每条轨道取前 3 章 preview + 总章节数 + 阅读数/评分统计。
   * 评分来自 ChapterInteraction 或同类表；此处用 viewCount 近似（项目无独立评分聚合表时）。
   */
  static async getBranchComparison(eventId: string): Promise<{
    main: import('./types').BranchComparisonTrack;
    branches: import('./types').BranchComparisonTrack[];
  } | null> {
    const event = await prisma.storyEvent.findUnique({
      where: { id: eventId },
      select: { id: true, storyId: true, title: true },
    });
    if (!event) return null;

    // ── 主线轨道 ─────────────────────────────────────────────────
    const mainStory = await prisma.story.findUnique({
      where: { id: event.storyId },
      select: { id: true, title: true },
    });
    if (!mainStory) return null;

    const mainChapters = await prisma.chapter.findMany({
      where: { storyId: event.storyId, branchId: null },
      orderBy: { orderIndex: 'asc' },
      select: { id: true, title: true, orderIndex: true },
    });
    const mainTrack = this.buildTrack(
      'main',
      'main',
      mainStory.title,
      mainChapters,
    );

    // ── 分支轨道（双轨）─────────────────────────────────────────
    // 主路：parentEventId 直接命中
    const directBranches = await prisma.branch.findMany({
      where: { parentEventId: eventId },
      select: {
        id: true,
        title: true,
        parentChapterId: true,
        viewCount: true,
        chapters: {
          orderBy: { orderIndex: 'asc' },
          take: this.COMPARISON_PREVIEW_CHAPTERS,
          select: { id: true, title: true, orderIndex: true },
        },
        _count: { select: { chapters: true } },
      },
    });

    // fallback：parentChapterId 命中事件 chapter 节点，且 parentEventId IS NULL
    const eventChapterNodes = await prisma.storyEventNode.findMany({
      where: { eventId, targetType: 'chapter' },
      select: { targetId: true },
    });
    const fallbackChapterIds = eventChapterNodes.map((n) => n.targetId);

    let fallbackBranches: typeof directBranches = [];
    if (fallbackChapterIds.length > 0) {
      fallbackBranches = await prisma.branch.findMany({
        where: {
          parentChapterId: { in: fallbackChapterIds },
          parentEventId: null,
        },
        select: {
          id: true,
          title: true,
          parentChapterId: true,
          viewCount: true,
          chapters: {
            orderBy: { orderIndex: 'asc' },
            take: this.COMPARISON_PREVIEW_CHAPTERS,
            select: { id: true, title: true, orderIndex: true },
          },
          _count: { select: { chapters: true } },
        },
      });
    }

    // 合并 + 去重（同一 branch id 只保留一次，主路优先）
    const seenBranchIds = new Set<string>(directBranches.map((b) => b.id));
    const allBranches = [
      ...directBranches,
      ...fallbackBranches.filter((b) => !seenBranchIds.has(b.id)),
    ];

    const branchTracks = allBranches.map((b) =>
      this.buildTrack(
        b.id,
        'branch',
        b.title,
        b.chapters.map((c) => ({
          id: c.id,
          title: c.title,
          orderIndex: c.orderIndex,
        })),
        b._count.chapters,
        b.viewCount,
      ),
    );

    return { main: mainTrack, branches: branchTracks };
  }

  /**
   * 构造一条轨道 DTO。
   * 章节数据已包含 viewCount 时用之；否则用 track 级 viewCount。
   */
  private static buildTrack(
    id: string,
    kind: 'main' | 'branch',
    title: string,
    chapters: Array<{ id: string; title: string; orderIndex: number; viewCount?: number }>,
    totalChaptersOverride?: number,
    trackViewCount?: number,
  ): import('./types').BranchComparisonTrack {
    const preview = chapters
      .slice(0, this.COMPARISON_PREVIEW_CHAPTERS)
      .map((c) => ({ id: c.id, title: c.title, orderIndex: c.orderIndex }));

    // 阅读数：优先累加章节 viewCount，否则用 track 级
    const readCount =
      chapters.length > 0 && chapters[0].viewCount !== undefined
        ? chapters.reduce((sum, c) => sum + (c.viewCount ?? 0), 0)
        : trackViewCount ?? null;

    return {
      id,
      kind,
      title,
      previewChapters: preview,
      totalChapters: totalChaptersOverride ?? chapters.length,
      stats: {
        readCount,
        // 项目无独立平均评分聚合表，暂返回 null（前端显示"暂无评分"）
        averageRating: null,
      },
    };
  }

  // ── 工具：批量查事件本体（含 isBranchPoint 判定）────────────────

  /**
   * 查事件本体。isBranchPoint = 事件含 branch 类型节点（由 nodeIndex 判定，调用方传入）。
   */
  static async getEvents(eventIds: string[]) {
    if (eventIds.length === 0) return [];
    return prisma.storyEvent.findMany({
      where: { id: { in: eventIds } },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        storyId: true,
        title: true,
        description: true,
        sortOrder: true,
        type: true,
        importance: true,
        color: true,
      },
    });
  }
}

/** 抑制未使用的 Prisma 导入告警（保留以备 Phase 3 原生 SQL 迁移） */
void Prisma;
