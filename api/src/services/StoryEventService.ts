import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { syncEventWikiMentions } from '../domains/eventConnector/WikiMentionParser';
import { safeFireAndForget } from '../utils/catchAsync';

export type StoryEventNodeInput = {
  targetType: 'chapter' | 'branch' | 'spinoff';
  targetId: string;
  sortOrder?: number;
  note?: string;
};

export class StoryEventService {
  static async create(data: {
    storyId: string;
    title: string;
    description?: string;
    type?: string;
    importance?: number;
    color?: string;
    sortOrder?: number;
    nodes?: StoryEventNodeInput[];
  }) {
    const story = await prisma.story.findUnique({ where: { id: data.storyId } });
    if (!story) throw new AppError(404, 'NOT_FOUND', '故事不存在');

    const maxOrder = await prisma.storyEvent.aggregate({
      where: { storyId: data.storyId },
      _max: { sortOrder: true },
    });
    const sortOrder = data.sortOrder ?? ((maxOrder._max.sortOrder ?? -1) + 1);

    const event = await prisma.storyEvent.create({
      data: {
        storyId: data.storyId,
        title: data.title,
        description: data.description,
        type: data.type || 'main_arc',
        importance: data.importance ?? 1,
        color: data.color,
        sortOrder,
        nodes: data.nodes?.length
          ? {
              create: data.nodes.map((n, i) => ({
                targetType: n.targetType,
                targetId: n.targetId,
                sortOrder: n.sortOrder ?? i,
                note: n.note,
              })),
            }
          : undefined,
      },
      include: { nodes: { orderBy: { sortOrder: 'asc' } } },
    });

    // Phase 3：异步解析 [[wiki:slug]] 引用落表，不阻塞响应。
    // 失败仅记日志，不影响事件本体写入成功的语义。
    safeFireAndForget(syncEventWikiMentions(event.id, event.description), {
      op: 'syncEventWikiMentions/create',
    });

    return event;
  }

  static async list(q?: string) {
    const where = q?.trim()
      ? {
          OR: [
            { title: { contains: q.trim() } },
            { description: { contains: q.trim() } },
            { type: { contains: q.trim() } },
          ],
        }
      : {};
    return prisma.storyEvent.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { nodes: { orderBy: { sortOrder: 'asc' } } },
      take: 50,
    });
  }

  static async getByStory(storyId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new AppError(404, 'NOT_FOUND', '故事不存在');

    return prisma.storyEvent.findMany({
      where: { storyId },
      orderBy: { sortOrder: 'asc' },
      include: { nodes: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  static async getById(id: string) {
    const event = await prisma.storyEvent.findUnique({
      where: { id },
      include: {
        nodes: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!event) throw new AppError(404, 'NOT_FOUND', '大事件不存在');
    return event;
  }

  static async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      type?: string;
      importance?: number;
      color?: string;
      sortOrder?: number;
    },
  ) {
    const existing = await prisma.storyEvent.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'NOT_FOUND', '大事件不存在');

    const updated = await prisma.storyEvent.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.importance !== undefined && { importance: data.importance }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: { nodes: { orderBy: { sortOrder: 'asc' } } },
    });

    // Phase 3：description 变更时同步 wiki 提及关系（fire-and-forget）
    if (data.description !== undefined) {
      safeFireAndForget(syncEventWikiMentions(updated.id, updated.description), {
        op: 'syncEventWikiMentions/update',
      });
    }

    return updated;
  }

  static async delete(id: string) {
    const existing = await prisma.storyEvent.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'NOT_FOUND', '大事件不存在');

    await prisma.storyEvent.delete({ where: { id } });
    return { success: true };
  }

  // ── Node management ──

  static async addNode(eventId: string, data: StoryEventNodeInput) {
    const event = await prisma.storyEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError(404, 'NOT_FOUND', '大事件不存在');

    const maxOrder = await prisma.storyEventNode.aggregate({
      where: { eventId },
      _max: { sortOrder: true },
    });
    const sortOrder = data.sortOrder ?? ((maxOrder._max.sortOrder ?? -1) + 1);

    return prisma.storyEventNode.create({
      data: {
        eventId,
        targetType: data.targetType,
        targetId: data.targetId,
        sortOrder,
        note: data.note,
      },
    });
  }

  static async removeNode(nodeId: string) {
    const node = await prisma.storyEventNode.findUnique({ where: { id: nodeId } });
    if (!node) throw new AppError(404, 'NOT_FOUND', '事件节点不存在');

    await prisma.storyEventNode.delete({ where: { id: nodeId } });
    return { success: true };
  }

  static async reorderNodes(eventId: string, nodeIds: string[]) {
    const event = await prisma.storyEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError(404, 'NOT_FOUND', '大事件不存在');

    await prisma.$transaction(
      nodeIds.map((nodeId, idx) =>
        prisma.storyEventNode.update({
          where: { id: nodeId },
          data: { sortOrder: idx },
        }),
      ),
    );

    return prisma.storyEventNode.findMany({
      where: { eventId },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
