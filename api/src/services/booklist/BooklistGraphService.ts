import { prisma } from '../../prisma';
import { AppError } from '../../utils/http';
import { BooklistLinksService } from './BooklistLinksService';

export class BooklistGraphService {
  /**
   * Get the full graph for a booklist: all items + all relations.
   */
  static async getGraph(booklistId: string) {
    const booklist = await prisma.booklist.findUnique({ where: { id: booklistId } });
    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');

    const [items, relations] = await Promise.all([
      prisma.booklistItem.findMany({
        where: { booklistId },
        orderBy: { orderIndex: 'asc' },
        include: {
          chapter: { select: { id: true, title: true, story: { select: { id: true, title: true } } } },
          outgoingEdges: {
            include: {
              targetItem: { select: { id: true, targetType: true, targetId: true } },
            },
          },
          incomingEdges: {
            include: {
              sourceItem: { select: { id: true, targetType: true, targetId: true } },
            },
          },
        },
      }),
      prisma.booklistItemRelation.findMany({
        where: {
          OR: [
            { sourceItem: { booklistId } },
            { targetItem: { booklistId } },
          ],
        },
        include: {
          sourceItem: { select: { id: true, targetType: true, targetId: true } },
          targetItem: { select: { id: true, targetType: true, targetId: true } },
        },
      }),
    ]);

    // Enrich wiki items with their titles
    const wikiItemIds = items
      .filter((item) => item.targetType === 'wiki' && item.targetId)
      .map((item) => item.targetId!);

    let wikiPages: Map<string, { title: string; contentType: string; summary: string | null }> = new Map();
    if (wikiItemIds.length > 0) {
      const pages = await prisma.wikiPage.findMany({
        where: { id: { in: wikiItemIds } },
        select: { id: true, title: true, contentType: true, summary: true },
      });
      wikiPages = new Map(pages.map((p) => [p.id, { title: p.title, contentType: p.contentType, summary: p.summary }]));
    }

    // Enrich spinoff items with their titles
    const spinoffItemIds = items
      .filter((item) => item.targetType === 'spinoff' && item.targetId && !item.chapterId)
      .map((item) => item.targetId!);

    let spinoffs: Map<string, { title: string }> = new Map();
    if (spinoffItemIds.length > 0) {
      const found = await prisma.spinoff.findMany({
        where: { id: { in: spinoffItemIds } },
        select: { id: true, title: true },
      });
      spinoffs = new Map(found.map((s) => [s.id, { title: s.title }]));
    }

    // Enrich branch items with their titles
    const branchItemIds = items
      .filter((item) => item.targetType === 'branch' && item.targetId && !item.chapterId)
      .map((item) => item.targetId!);

    let branches: Map<string, { title: string }> = new Map();
    if (branchItemIds.length > 0) {
      const found = await prisma.branch.findMany({
        where: { id: { in: branchItemIds } },
        select: { id: true, title: true },
      });
      branches = new Map(found.map((b) => [b.id, { title: b.title }]));
    }

    const enrichedItems = items.map((item) => ({
      ...item,
      wiki: item.targetType === 'wiki' && item.targetId ? wikiPages.get(item.targetId) || null : null,
      spinoff: item.targetType === 'spinoff' && item.targetId ? spinoffs.get(item.targetId) || null : null,
      branch: item.targetType === 'branch' && item.targetId ? branches.get(item.targetId) || null : null,
    }));

    return {
      items: enrichedItems,
      relations,
      nodes: items.length,
      edges: relations.length,
    };
  }

  /**
   * Create a typed relation between two booklist items.
   */
  static async createRelation(booklistId: string, creatorId: string, userRole: string, data: {
    sourceItemId: string;
    targetItemId: string;
    relationType: string;
    label?: string;
  }) {
    const booklist = await prisma.booklist.findUnique({ where: { id: booklistId } });
    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');
    if (booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    // Verify both items exist and belong to this booklist
    const [source, target] = await Promise.all([
      prisma.booklistItem.findFirst({ where: { id: data.sourceItemId, booklistId } }),
      prisma.booklistItem.findFirst({ where: { id: data.targetItemId, booklistId } }),
    ]);
    if (!source) throw new AppError(404, 'NOT_FOUND', '源条目不存在');
    if (!target) throw new AppError(404, 'NOT_FOUND', '目标条目不存在');

    // Check for duplicate
    const existing = await prisma.booklistItemRelation.findUnique({
      where: {
        sourceItemId_targetItemId_relationType: {
          sourceItemId: data.sourceItemId,
          targetItemId: data.targetItemId,
          relationType: data.relationType,
        },
      },
    });
    if (existing) {
      throw new AppError(409, 'CONFLICT', '该关系已存在');
    }

    const relation = await prisma.booklistItemRelation.create({
      data: {
        sourceItemId: data.sourceItemId,
        targetItemId: data.targetItemId,
        relationType: data.relationType,
        label: data.label || null,
      },
      include: {
        sourceItem: { select: { id: true, targetType: true, targetId: true } },
        targetItem: { select: { id: true, targetType: true, targetId: true } },
      },
    });

    // Sync story links after adding relation
    await BooklistLinksService.syncStoryLinks(booklistId);

    return relation;
  }

  /**
   * Delete a relation from a booklist.
   */
  static async deleteRelation(booklistId: string, relationId: string, creatorId: string, userRole: string) {
    const booklist = await prisma.booklist.findUnique({ where: { id: booklistId } });
    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');
    if (booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    const relation = await prisma.booklistItemRelation.findFirst({
      where: { id: relationId },
      include: { sourceItem: true },
    });
    if (!relation || relation.sourceItem.booklistId !== booklistId) {
      throw new AppError(404, 'NOT_FOUND', '关系不存在');
    }

    await prisma.booklistItemRelation.delete({ where: { id: relationId } });

    // Re-sync story links
    await BooklistLinksService.syncStoryLinks(booklistId);

    return { success: true, message: '关系已删除' };
  }
}
