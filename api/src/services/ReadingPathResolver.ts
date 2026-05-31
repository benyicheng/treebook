import { prisma } from '../prisma';
import { AppError } from '../utils/http';

interface ResolvedNode {
  id: string;
  contentId: string;
  contentType: 'chapter' | 'branch' | 'spinoff';
  title: string;
  description?: string | null;
}

export class ReadingPathResolver {
  /**
   * 解析单个 contentId 为实际内容
   * ReadingPathNode.contentId 是多态外键，需要根据 nodeCategory 查对应表
   */
  static async resolveNode(nodeCategory: string, contentId: string): Promise<ResolvedNode> {
    switch (nodeCategory) {
      case 'chapter': {
        const ch = await prisma.chapter.findUnique({
          where: { id: contentId },
          select: { id: true, title: true, content: true },
        });
        if (!ch) throw new AppError(404, 'NODE_NOT_FOUND', `Chapter ${contentId} not found`);
        return {
          id: ch.id,
          contentId: ch.id,
          contentType: 'chapter',
          title: ch.title,
          description: ch.content?.slice(0, 200),
        };
      }
      case 'branch': {
        const br = await prisma.branch.findUnique({
          where: { id: contentId },
          select: { id: true, title: true, description: true },
        });
        if (!br) throw new AppError(404, 'NODE_NOT_FOUND', `Branch ${contentId} not found`);
        return {
          id: br.id,
          contentId: br.id,
          contentType: 'branch',
          title: br.title,
          description: br.description,
        };
      }
      case 'spinoff': {
        const sp = await prisma.spinoff.findUnique({
          where: { id: contentId },
          select: { id: true, title: true, summary: true },
        });
        if (!sp) throw new AppError(404, 'NODE_NOT_FOUND', `Spinoff ${contentId} not found`);
        return {
          id: sp.id,
          contentId: sp.id,
          contentType: 'spinoff',
          title: sp.title,
          description: sp.summary,
        };
      }
      default:
        throw new AppError(400, 'INVALID_NODE_CATEGORY', `Unknown node category: ${nodeCategory}`);
    }
  }

  /**
   * 批量解析路径中的所有节点
   * 失败节点返回占位 ResolvedNode（title 含 [已删除] 标记），不静默丢弃
   */
  static async resolvePathNodes(
    nodes: {
      id: string;
      nodeCategory: string;
      contentId: string;
      contentTitle?: string | null;
      note?: string | null;
      estimatedMin?: number | null;
      sortOrder: number;
    }[],
  ): Promise<ResolvedNode[]> {
    const results = await Promise.allSettled(
      nodes.map((n) => this.resolveNode(n.nodeCategory, n.contentId)),
    );

    return results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      // 占位节点：标记内容已失效，让调用方和前端感知
      const node = nodes[i];
      return {
        id: node.id,
        contentId: node.contentId,
        contentType: node.nodeCategory as 'chapter' | 'branch' | 'spinoff',
        title: `[已删除] ${node.contentId}`,
        description: `内容已被删除，无法解析: ${String((r as PromiseRejectedResult).reason)}`,
      };
    });
  }
}
