import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { parsePagination, paginatedResponse, PaginatedResponse } from '../utils/pagination';

export class WikiService {
  // ── WikiPage CRUD ─────────────────────────────────

  static async createWikiPage(authorId: string, data: any) {
    const { storyId, title, slug: rawSlug, contentType, content, summary, attributes, status } = data;

    // Auto-generate slug from title if not provided
    const slug = rawSlug || title
      .toLowerCase()
      .replace(/[\u4e00-\u9fff]+/g, '-')
      .replace(/[^a-z0-9_-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 200) || 'untitled';

    // If story-scoped, verify story exists
    if (storyId) {
      const story = await prisma.story.findUnique({ where: { id: storyId } });
      if (!story) throw new AppError(404, 'NOT_FOUND', '关联故事不存在');
    }

    // Check slug uniqueness within story (or globally if no story)
    const existing = storyId
      ? await prisma.wikiPage.findUnique({ where: { storyId_slug: { storyId, slug } } })
      : await prisma.wikiPage.findFirst({ where: { storyId: null, slug } });

    if (existing) {
      throw new AppError(409, 'CONFLICT', '该别名已被使用，请更换');
    }

    return prisma.wikiPage.create({
      data: {
        storyId: storyId || null,
        title,
        slug,
        contentType,
        content,
        summary: summary || null,
        attributes: attributes ? JSON.stringify(attributes) : null,
        status: status || 'published',
        createdBy: authorId,
      },
      include: {
        creator: { select: { id: true, username: true } },
        aliases: true,
      },
    });
  }

  static async getWikiPage(id: string) {
    const page = await prisma.wikiPage.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, username: true, role: true } },
        aliases: true,
        outgoingLinks: {
          include: {
            targetPage: { select: { id: true, title: true, slug: true, contentType: true } },
          },
        },
        incomingLinks: {
          include: {
            sourcePage: { select: { id: true, title: true, slug: true, contentType: true } },
          },
        },
        story: { select: { id: true, title: true } },
      },
    });

    if (!page) throw new AppError(404, 'NOT_FOUND', '百科页面不存在');

    return {
      ...page,
      attributes: page.attributes ? JSON.parse(page.attributes) : null,
    };
  }

  static async getWikiPages(query: {
    storyId?: string;
    contentType?: string;
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  } = {}): Promise<PaginatedResponse<any>> {
    const { page, limit } = parsePagination(query);

    const where: any = {};

    if (query.storyId) where.storyId = query.storyId;
    if (query.contentType) where.contentType = query.contentType;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { aliases: { some: { alias: { contains: query.search } } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.wikiPage.findMany({
        where,
        include: {
          creator: { select: { id: true, username: true } },
          aliases: true,
          _count: { select: { outgoingLinks: true, incomingLinks: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.wikiPage.count({ where }),
    ]);

    return paginatedResponse(items, total, page, limit);
  }

  static async updateWikiPage(id: string, authorId: string, userRole: string, data: any) {
    const page = await prisma.wikiPage.findUnique({ where: { id } });
    if (!page) throw new AppError(404, 'NOT_FOUND', '百科页面不存在');

    // Permission: page creator, story author (if storyId set), or admin
    const hasPermission = await this._checkPagePermission(page, authorId, userRole);
    if (!hasPermission) {
      throw new AppError(403, 'FORBIDDEN', '无权修改此百科页面');
    }

    const { storyId, title, slug, contentType, content, summary, attributes, status } = data;

    // If slug changed, check uniqueness
    if (slug && slug !== page.slug) {
      const effectiveStoryId = storyId !== undefined ? storyId : page.storyId;
      const existing = effectiveStoryId
        ? await prisma.wikiPage.findUnique({ where: { storyId_slug: { storyId: effectiveStoryId, slug } } })
        : await prisma.wikiPage.findFirst({ where: { storyId: null, slug } });

      if (existing && existing.id !== id) {
        throw new AppError(409, 'CONFLICT', '该别名已被使用，请更换');
      }
    }

    return prisma.wikiPage.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(contentType !== undefined && { contentType }),
        ...(content !== undefined && { content }),
        ...(summary !== undefined && { summary: summary || null }),
        ...(attributes !== undefined && { attributes: attributes ? JSON.stringify(attributes) : null }),
        ...(status !== undefined && { status }),
        ...(storyId !== undefined && { storyId: storyId || null }),
        version: { increment: 1 },
      },
      include: {
        aliases: true,
        creator: { select: { id: true, username: true } },
      },
    });
  }

  static async deleteWikiPage(id: string, authorId: string, userRole: string) {
    const page = await prisma.wikiPage.findUnique({ where: { id } });
    if (!page) throw new AppError(404, 'NOT_FOUND', '百科页面不存在');

    const hasPermission = await this._checkPagePermission(page, authorId, userRole);
    if (!hasPermission) {
      throw new AppError(403, 'FORBIDDEN', '无权删除此百科页面');
    }

    await prisma.wikiPage.delete({ where: { id } });
    return { success: true, message: '百科页面已删除' };
  }

  // ── Alias Management ───────────────────────────────

  static async addAlias(pageId: string, data: { alias: string; language?: string | null }) {
    const page = await prisma.wikiPage.findUnique({ where: { id: pageId } });
    if (!page) throw new AppError(404, 'NOT_FOUND', '百科页面不存在');

    return prisma.wikiAlias.create({
      data: {
        wikiPageId: pageId,
        alias: data.alias,
        language: data.language || null,
      },
    });
  }

  static async removeAlias(pageId: string, aliasId: string) {
    const alias = await prisma.wikiAlias.findFirst({
      where: { id: aliasId, wikiPageId: pageId },
    });
    if (!alias) throw new AppError(404, 'NOT_FOUND', '别名不存在');

    await prisma.wikiAlias.delete({ where: { id: aliasId } });
    return { success: true, message: '别名已删除' };
  }

  // ── Link Management ────────────────────────────────

  static async createLink(pageId: string, data: { targetPageId: string; linkType: string }) {
    // Verify both pages exist
    const [source, target] = await Promise.all([
      prisma.wikiPage.findUnique({ where: { id: pageId } }),
      prisma.wikiPage.findUnique({ where: { id: data.targetPageId } }),
    ]);
    if (!source) throw new AppError(404, 'NOT_FOUND', '源百科页面不存在');
    if (!target) throw new AppError(404, 'NOT_FOUND', '目标百科页面不存在');

    // Check for duplicate
    const existing = await prisma.wikiLink.findUnique({
      where: {
        sourcePageId_targetPageId_linkType: {
          sourcePageId: pageId,
          targetPageId: data.targetPageId,
          linkType: data.linkType,
        },
      },
    });
    if (existing) throw new AppError(409, 'CONFLICT', '该链接已存在');

    return prisma.wikiLink.create({
      data: {
        sourcePageId: pageId,
        targetPageId: data.targetPageId,
        linkType: data.linkType,
      },
      include: {
        targetPage: { select: { id: true, title: true, slug: true, contentType: true } },
      },
    });
  }

  static async removeLink(pageId: string, linkId: string) {
    const link = await prisma.wikiLink.findFirst({
      where: { id: linkId, sourcePageId: pageId },
    });
    if (!link) throw new AppError(404, 'NOT_FOUND', '链接不存在');

    await prisma.wikiLink.delete({ where: { id: linkId } });
    return { success: true, message: '链接已删除' };
  }

  // ── Lookup (for WikiPopover) ───────────────────────

  /**
   * 轻量级百科条目查找：按标题或别名搜索，返回精简数据，用于前端弹窗
   */
  static async lookupWikis(query: string, limit: number = 5) {
    if (!query?.trim()) return [];

    const pages = await prisma.wikiPage.findMany({
      where: {
        status: 'published',
        OR: [
          { title: { contains: query.trim() } },
          { aliases: { some: { alias: { contains: query.trim() } } } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        contentType: true,
        storyId: true,
        _count: { select: { outgoingLinks: true, incomingLinks: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return pages;
  }

  // ── Helpers ────────────────────────────────────────

  private static async _checkPagePermission(page: { storyId: string | null; createdBy: string }, userId: string, userRole: string): Promise<boolean> {
    if (page.createdBy === userId || userRole === 'admin') return true;

    // Story author can manage wiki pages scoped to their story
    if (page.storyId) {
      const story = await prisma.story.findUnique({
        where: { id: page.storyId },
        select: { authorId: true },
      });
      if (story?.authorId === userId) return true;
    }

    return false;
  }
}
