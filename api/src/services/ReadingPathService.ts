import crypto from 'crypto';
import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { parsePagination, paginatedResponse, PaginatedResponse } from '../utils/pagination';
import { ReadingPathResolver } from './ReadingPathResolver';

interface CreateReadingPathInput {
  storyId?: string | null;
  booklistId?: string | null;
  creatorId: string;
  title: string;
  description?: string;
  guideType?: string;
  origin?: string;
  nodes: {
    sortOrder: number;
    nodeCategory: string;
    contentId: string;
    storyId?: string | null;
    storyTitle?: string | null;
    introduction?: string;
    note?: string;
    eventId?: string | null;
  }[];
}

interface ReadingPathListItem {
  id: string;
  title: string;
  description: string | null;
  origin: string;
  creator: { id: string; username: string; avatarUrl: string | null };
  viewCount: number;
  startCount: number;
  completionCount: number;
  nodeCount: number;
  createdAt: Date;
}

interface ReadingPathDetail extends ReadingPathListItem {
  storyId: string | null;
  booklistId: string | null;
  booklist: { id: string; title: string } | null;
  guideType: string | null;
  nodes: {
    id: string;
    sortOrder: number;
    nodeCategory: string;
    contentId: string;
    contentTitle: string;
    introduction: string | null;
    note: string | null;
    estimatedMin: number | null;
    eventId: string | null;
  }[];
}

export class ReadingPathService {
  /**
   * 获取全局阅读路径列表（支持排序）
   */
  static async getAllPaths(
    sortBy: 'hot' | 'new' = 'hot',
    query: { page?: string; limit?: string } = {},
  ): Promise<PaginatedResponse<any>> {
    const { page, limit } = parsePagination(query);

    const orderBy: any =
      sortBy === 'new'
        ? [{ createdAt: 'desc' }]
        : [{ viewCount: 'desc' }, { createdAt: 'desc' }];

    const where = { status: 'published' as const };

    const [paths, total] = await Promise.all([
      prisma.readingPath.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: { select: { id: true, username: true, avatarUrl: true } },
          story: { select: { id: true, title: true } },
          _count: { select: { nodes: true } },
        },
      }),
      prisma.readingPath.count({ where }),
    ]);

    return paginatedResponse(
      paths.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        origin: p.origin,
        creator: p.creator,
        viewCount: p.viewCount,
        startCount: p.startCount,
        completionCount: p.completionCount,
        nodeCount: p._count.nodes,
        createdAt: p.createdAt,
      })),
      total,
      page,
      limit,
    );
  }

  /**
   * 获取某宇宙的阅读路径列表
   */
  static async getPathsByStory(storyId: string, query: { page?: string; limit?: string } = {}): Promise<PaginatedResponse<any>> {
    const { page, limit } = parsePagination(query);

    const where = { storyId, status: 'published' as const };
    const [paths, total] = await Promise.all([
      prisma.readingPath.findMany({
        where,
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { nodes: true } },
        },
      }),
      prisma.readingPath.count({ where }),
    ]);

    return paginatedResponse(
      paths.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        origin: p.origin,
        creator: p.creator,
        viewCount: p.viewCount,
        startCount: p.startCount,
        completionCount: p.completionCount,
        nodeCount: p._count.nodes,
        createdAt: p.createdAt,
      })),
      total,
      page,
      limit,
    );
  }

  /**
   * 获取阅读路径详情（包含已解析的节点）
   */
  static async getPathById(pathId: string): Promise<ReadingPathDetail> {
    const path = await prisma.readingPath.findUnique({
      where: { id: pathId },
      include: {
        creator: { select: { id: true, username: true, avatarUrl: true } },
        nodes: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { nodes: true } },
      },
    });

    if (!path) {
      throw new AppError(404, 'NOT_FOUND', 'Reading path not found');
    }

    // Resolve node titles
    const resolvedTitles = new Map<string, string>();
    const resolvedNodes = await ReadingPathResolver.resolvePathNodes(path.nodes);
    for (const rn of resolvedNodes) {
      resolvedTitles.set(rn.contentId, rn.title);
    }

    // Resolve parent booklist if applicable
    let booklist: { id: string; title: string } | null = null;
    if (path.booklistId) {
      const bl = await prisma.booklist.findUnique({
        where: { id: path.booklistId },
        select: { id: true, title: true },
      });
      if (bl) booklist = bl;
    }

    return {
      id: path.id,
      storyId: path.storyId,
      booklistId: path.booklistId,
      booklist,
      title: path.title,
      description: path.description,
      guideType: path.guideType,
      origin: path.origin,
      creator: path.creator,
      viewCount: path.viewCount,
      startCount: path.startCount,
      completionCount: path.completionCount,
      nodeCount: path._count.nodes,
      createdAt: path.createdAt,
      nodes: path.nodes.map((n) => ({
        id: n.id,
        sortOrder: n.sortOrder,
        nodeCategory: n.nodeCategory,
        contentId: n.contentId,
        contentTitle: resolvedTitles.get(n.contentId) || n.contentTitle || '(未知)',
        introduction: n.introduction,
        note: n.note,
        estimatedMin: n.estimatedMin,
        eventId: n.eventId,
      })),
    };
  }

  /**
   * 创建阅读路径（支持单故事或跨故事）
   */
  static async createPath(input: CreateReadingPathInput) {
    // Verify story exists if provided
    if (input.storyId) {
      const story = await prisma.story.findUnique({ where: { id: input.storyId } });
      if (!story) throw new AppError(404, 'NOT_FOUND', '关联故事不存在');
    }

    // Verify booklist exists if provided
    if (input.booklistId) {
      const booklist = await prisma.booklist.findUnique({ where: { id: input.booklistId } });
      if (!booklist) throw new AppError(404, 'NOT_FOUND', '关联书单不存在');
    }

    const path = await prisma.readingPath.create({
      data: {
        storyId: input.storyId || null,
        booklistId: input.booklistId || null,
        creatorId: input.creatorId,
        title: input.title,
        description: input.description,
        guideType: input.guideType,
        origin: input.origin || 'community',
      nodes: {
        create: input.nodes.map((n) => ({
          sortOrder: n.sortOrder,
          nodeCategory: n.nodeCategory,
          contentId: n.contentId,
          storyId: n.storyId || null,
          storyTitle: n.storyTitle || null,
          introduction: n.introduction,
          note: n.note,
          eventId: n.eventId || null,
        })),
      },
      },
      include: {
        creator: { select: { id: true, username: true, avatarUrl: true } },
        nodes: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return path;
  }

  /**
   * 更新阅读路径（标题、简介、节点列表）
   */
  static async updatePath(
    pathId: string,
    userId: string,
    input: {
      title?: string;
      description?: string | null;
      guideType?: string;
      nodes?: { sortOrder: number; nodeCategory: string; contentId: string; storyId?: string | null; storyTitle?: string | null; introduction?: string; note?: string; eventId?: string | null }[];
    },
  ) {
    const existing = await prisma.readingPath.findUnique({ where: { id: pathId } });
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Reading path not found');
    if (existing.creatorId !== userId)
      throw new AppError(403, 'FORBIDDEN', 'You can only edit your own reading paths');

    const path = await prisma.$transaction(async (tx) => {
      // Update basic fields
      const updated = await tx.readingPath.update({
        where: { id: pathId },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description || null }),
          ...(input.guideType !== undefined && { guideType: input.guideType }),
        },
      });

      // If nodes provided, replace all
      if (input.nodes) {
        await tx.readingPathNode.deleteMany({ where: { pathId } });
        await tx.readingPathNode.createMany({
          data: input.nodes.map((n) => ({
            pathId,
            sortOrder: n.sortOrder,
            nodeCategory: n.nodeCategory,
            contentId: n.contentId,
            storyId: n.storyId ?? null,
            storyTitle: n.storyTitle ?? null,
            introduction: n.introduction,
            note: n.note,
            eventId: n.eventId ?? null,
          })),
        });
      }

      return tx.readingPath.findUnique({
        where: { id: pathId },
        include: {
          creator: { select: { id: true, username: true, avatarUrl: true } },
          nodes: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { nodes: true } },
        },
      });
    });

    return path;
  }

  /**
   * 增加阅读路径的浏览次数
   */
  static async incrementViewCount(pathId: string) {
    await prisma.readingPath.update({
      where: { id: pathId },
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * 开始阅读路径：创建或返回已有的活跃 Trail
   */
  static async startReading(pathId: string, userId: string) {
    const path = await prisma.readingPath.findUnique({ where: { id: pathId } });
    if (!path) throw new AppError(404, 'NOT_FOUND', 'Reading path not found');

    const existingTrail = await prisma.readingTrail.findFirst({
      where: { pathId, userId, completedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (existingTrail) return existingTrail;

    const firstNode = await prisma.readingPathNode.findFirst({
      where: { pathId },
      orderBy: { sortOrder: 'asc' },
    });

    const trail = await prisma.readingTrail.create({
      data: {
        userId,
        pathId,
        storyId: path.storyId,
        currentNodeId: firstNode?.id || null,
        currentNodeIndex: firstNode ? 0 : -1,
        trailNodes: JSON.stringify([]),
      },
    });

    return trail;
  }

  /**
   * 获取阅读路径的角色出场信息
   * 返回: 每个节点 → 该节点内容中出场的角色列表
   */
  static async getPathCharacters(pathId: string) {
    const path = await prisma.readingPath.findUnique({
      where: { id: pathId },
      include: {
        nodes: { orderBy: { sortOrder: 'asc' } },
        story: { select: { id: true } },
      },
    });
    if (!path) throw new AppError(404, 'NOT_FOUND', 'Reading path not found');

    // 收集所有 (targetType, targetId) 对
    const targets = path.nodes.map((n) => ({
      targetType: n.nodeCategory,
      targetId: n.contentId,
    }));

    if (targets.length === 0) {
      return { characters: [], nodeCharacterMap: {} };
    }

    // 批量查询角色出场记录
    const appearances = await prisma.characterAppearance.findMany({
      where: {
        OR: targets.map((t) => ({
          targetType: t.targetType,
          targetId: t.targetId,
        })),
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            description: true,
          },
        },
      },
    });

    // 按 nodeId 分组
    const nodeCharacterMap: Record<string, typeof appearances> = {};
    const characterSet = new Set<string>();
    const allCharacters: typeof appearances = [];

    for (const node of path.nodes) {
      const nodeApps = appearances.filter(
        (a) => a.targetType === node.nodeCategory && a.targetId === node.contentId,
      );
      if (nodeApps.length > 0) {
        nodeCharacterMap[node.id] = nodeApps;
      }
      for (const app of nodeApps) {
        if (!characterSet.has(app.character.id)) {
          characterSet.add(app.character.id);
          allCharacters.push(app);
        }
      }
    }

    return { allCharacters, nodeCharacterMap };
  }

  /**
   * 获取 Trail 详情（含当前节点信息）
   */
  static async getTrail(trailId: string, userId: string) {
    const trail = await prisma.readingTrail.findUnique({
      where: { id: trailId },
      include: {
        path: {
          include: {
            nodes: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!trail || trail.userId !== userId) {
      throw new AppError(404, 'NOT_FOUND', 'Trail not found');
    }

    return trail;
  }

  /**
   * 前进到下一节点，若已读完则标记完成
   */
  static async advanceTrail(trailId: string, userId: string) {
    const trail = await prisma.readingTrail.findUnique({
      where: { id: trailId },
      include: { path: { include: { nodes: { orderBy: { sortOrder: 'asc' } } } } },
    });

    if (!trail || trail.userId !== userId) {
      throw new AppError(404, 'NOT_FOUND', 'Trail not found');
    }
    if (trail.completedAt) {
      throw new AppError(400, 'ALREADY_COMPLETED', 'Trail already completed');
    }

    const totalNodes = trail.path!.nodes.length;
    const nextIndex = trail.currentNodeIndex + 1;

    if (nextIndex >= totalNodes) {
      // 全部读完，标记完成
      const updated = await prisma.readingTrail.update({
        where: { id: trailId },
        data: {
          completedAt: new Date(),
          currentNodeIndex: nextIndex,
          currentNodeId: null,
        },
      });
      return { ...updated, isCompleted: true };
    }

    const nextNode = trail.path!.nodes[nextIndex];
    const updated = await prisma.readingTrail.update({
      where: { id: trailId },
      data: {
        currentNodeIndex: nextIndex,
        currentNodeId: nextNode.id,
      },
    });
    return { ...updated, isCompleted: false };
  }

  // ── Phase 4: 路径叉路（fork）─────────────────────────────────────

  /**
   * 在路径的指定事件处插入一个"叉路选择点"。
   *
   * 行为：
   * 1. 校验路径归属（仅创建者可 fork）
   * 2. 校验 atEventId 在该路径中存在对应节点
   * 3. 校验 branchOptions 数量合法（2-5）且 primary 在 options 内
   * 4. 生成 forkGroupId（uuid）
   * 5. 在 atEvent 节点之后插入 N 个分支节点，共享 forkGroupId，
   *    primary 的设 isForkPrimary=true
   * 6. 后续节点 sortOrder 顺延
   *
   * @returns ForkPathResultDTO（pathId / forkGroupId / addedNodes）
   */
  static async forkPath(
    pathId: string,
    userId: string,
    input: {
      atEventId: string;
      branchOptions: string[]; // branch ids
      primary: string; // branch id，必须在 branchOptions 内
    },
  ): Promise<{ pathId: string; forkGroupId: string; addedNodes: number }> {
    const { atEventId, branchOptions, primary } = input;

    // ── 校验 ────────────────────────────────────────────────────
    if (branchOptions.length < 2 || branchOptions.length > 5) {
      throw new AppError(400, 'VALIDATION_ERROR', '分支选项数量必须在 2-5 之间');
    }
    if (!branchOptions.includes(primary)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'primary 必须在 branchOptions 内');
    }

    const existing = await prisma.readingPath.findUnique({ where: { id: pathId } });
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Reading path not found');
    if (existing.creatorId !== userId) {
      throw new AppError(403, 'FORBIDDEN', '只有路径创建者可以添加叉路');
    }

    // 找到 atEvent 对应的节点（该路径中引用此事件的节点）
    const atNode = await prisma.readingPathNode.findFirst({
      where: { pathId, eventId: atEventId },
      orderBy: { sortOrder: 'asc' },
    });
    if (!atNode) {
      throw new AppError(404, 'NOT_FOUND', '该事件不在当前路径中');
    }

    // ── 校验 branchOptions 都是真实存在的分支 ────────────────────
    const branches = await prisma.branch.findMany({
      where: { id: { in: branchOptions } },
      select: { id: true, title: true },
    });
    if (branches.length !== branchOptions.length) {
      throw new AppError(400, 'VALIDATION_ERROR', '部分 branchOptions 不存在');
    }
    const branchMap = new Map(branches.map((b) => [b.id, b.title]));

    // ── 事务：插入叉路节点 + 后续节点 sortOrder 顺延 ──────────────
    const forkGroupId = crypto.randomUUID();
    const insertSortOrder = atNode.sortOrder + 1;

    const result = await prisma.$transaction(async (tx) => {
      // 1. 后续节点 sortOrder +branchOptions.length，腾出叉路位置
      await tx.readingPathNode.updateMany({
        where: { pathId, sortOrder: { gte: insertSortOrder } },
        data: { sortOrder: { increment: branchOptions.length } },
      });

      // 2. 插入叉路节点（每个 branch 一个）
      const created = await Promise.all(
        branchOptions.map((branchId, idx) =>
          tx.readingPathNode.create({
            data: {
              pathId,
              sortOrder: insertSortOrder + idx,
              nodeCategory: 'branch',
              contentId: branchId,
              contentTitle: branchMap.get(branchId) ?? '未知分支',
              eventId: atEventId,
              forkGroupId,
              isForkPrimary: branchId === primary,
            },
          }),
        ),
      );

      return created;
    });

    return {
      pathId,
      forkGroupId,
      addedNodes: result.length,
    };
  }
}
