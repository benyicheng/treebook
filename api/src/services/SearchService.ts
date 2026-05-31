import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

export interface SearchResult {
  title: string;
  type: 'story' | 'chapter' | 'branch' | 'spinoff' | 'author';
  sourceId: string;
  highlight: string;
  metadata: {
    storyId?: string;
    authorId?: string;
    branchId?: string;
  };
  rank: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  type: string | null;
}

export class SearchService {
  private static readonly MAX_RESULTS = 20;
  private static readonly TIMEOUT_MS = 500;

  /**
   * FTS5 全文搜索
   * - 支持类型过滤：story / branch / spinoff / chapter / author
   * - 按 relevance rank 排序
   * - 空结果回退到热门推荐
   */
  static async searchAll(
    query: string,
    type?: string | null,
    limit: number = 20,
    offset: number = 0,
  ): Promise<SearchResponse> {
    const safeQuery = query.trim();
    if (!safeQuery) {
      return this.getHotRecommendations(limit, offset, type);
    }

    const safeLimit = Math.min(Math.max(1, limit), 50);

    try {
      // FTS5 MATCH 表达式：双引号精确短语匹配
      const matchExpr = safeQuery
        .split(/\s+/)
        .map((t) => `"${t.replace(/"/g, '""')}"`)
        .join(' ');

      const hasTypeFilter = type && type !== 'all';

      // 参数化查询：Prisma.sql 模板标签自动转义，杜绝 SQL 注入
      const countRows = await prisma.$queryRaw<Array<{ cnt: number }>>(
        hasTypeFilter
          ? Prisma.sql`SELECT count(*) as cnt FROM content_fts WHERE content_fts MATCH ${matchExpr} AND type = ${type}`
          : Prisma.sql`SELECT count(*) as cnt FROM content_fts WHERE content_fts MATCH ${matchExpr}`,
      );

      const rows = await prisma.$queryRaw<
        Array<{
          title: string;
          content: string;
          type: string;
          sourceId: string;
          metadata: string;
          rank: number;
        }>
      >(
        hasTypeFilter
          ? Prisma.sql`SELECT title, content, type, sourceId, metadata, rank FROM content_fts WHERE content_fts MATCH ${matchExpr} AND type = ${type} ORDER BY rank LIMIT ${safeLimit} OFFSET ${offset}`
          : Prisma.sql`SELECT title, content, type, sourceId, metadata, rank FROM content_fts WHERE content_fts MATCH ${matchExpr} ORDER BY rank LIMIT ${safeLimit} OFFSET ${offset}`,
      );

      const total = Number(countRows[0]?.cnt ?? 0);

      if (total === 0) {
        return this.getHotRecommendations(safeLimit, offset, type);
      }

      const results: SearchResult[] = rows.map((row) => {
        let metadata: Record<string, string> = {};
        try {
          metadata = JSON.parse(row.metadata || '{}');
        } catch (parseErr) {
          console.debug('metadata parse error:', parseErr);
        }

        // 提取匹配关键词前后的片段作为 highlight
        const highlight = this.extractHighlight(row.content || row.title, safeQuery);

        return {
          title: row.title,
          type: row.type as SearchResult['type'],
          sourceId: row.sourceId,
          highlight,
          metadata,
          rank: row.rank,
        };
      });

      return { results, total, query: safeQuery, type: type || null };
    } catch (err: unknown) {
      console.error('FTS5 search error:', err instanceof Error ? err.message : String(err));
      return this.getHotRecommendations(safeLimit, offset, type);
    }
  }

  /**
   * 从文本中提取关键词周围的片段
   */
  private static extractHighlight(text: string, query: string, contextLen = 80): string {
    if (!text) return '';
    const terms = query.split(/\s+/).filter((t) => t.length > 0);
    for (const term of terms) {
      const idx = text.toLowerCase().indexOf(term.toLowerCase());
      if (idx >= 0) {
        const start = Math.max(0, idx - contextLen);
        const end = Math.min(text.length, idx + term.length + contextLen);
        let snippet = text.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';
        return snippet;
      }
    }
    return text.substring(0, contextLen * 2) + (text.length > contextLen * 2 ? '...' : '');
  }

  /**
   * 热门推荐兜底 — 按浏览量排序
   */
  private static async getHotRecommendations(
    limit: number,
    offset: number,
    type?: string | null,
  ): Promise<SearchResponse> {
    const results: SearchResult[] = [];

    if (!type || type === 'all' || type === 'story') {
      const stories = await prisma.story.findMany({
        take: Math.ceil(limit / 2),
        skip: offset,
        orderBy: { viewCount: 'desc' },
        select: { id: true, title: true, description: true, authorId: true },
      });
      for (const s of stories) {
        results.push({
          title: s.title,
          type: 'story',
          sourceId: s.id,
          highlight: s.description || s.title,
          metadata: { storyId: s.id, authorId: s.authorId },
          rank: 0,
        });
      }
    }

    if (!type || type === 'all' || type === 'branch') {
      const branches = await prisma.branch.findMany({
        take: Math.ceil(limit / 4),
        skip: offset,
        orderBy: { viewCount: 'desc' },
        select: { id: true, title: true, description: true, authorId: true, parentStoryId: true },
      });
      for (const b of branches) {
        results.push({
          title: b.title,
          type: 'branch',
          sourceId: b.id,
          highlight: b.description || b.title,
          metadata: { storyId: b.parentStoryId, authorId: b.authorId },
          rank: 0,
        });
      }
    }

    if (!type || type === 'all' || type === 'spinoff') {
      const spinoffs = await prisma.spinoff.findMany({
        take: Math.ceil(limit / 4),
        skip: offset,
        orderBy: { viewCount: 'desc' },
        select: { id: true, title: true, summary: true, authorId: true, originalStoryId: true },
      });
      for (const s of spinoffs) {
        results.push({
          title: s.title,
          type: 'spinoff',
          sourceId: s.id,
          highlight: s.summary || s.title,
          metadata: { storyId: s.originalStoryId, authorId: s.authorId },
          rank: 0,
        });
      }
    }

    return {
      results: results.slice(0, limit),
      total: results.length,
      query: '',
      type: type || null,
    };
  }
}
