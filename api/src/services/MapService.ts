import { prisma } from '../prisma';
import { AppError } from '../utils/http';

interface MapNodeData {
  id: string;
  title: string;
  orderIndex?: number;
  description?: string | null;
  category: 'chapter' | 'branch' | 'spinoff';
  parentChapterId?: string | null;
  parentStoryId?: string | null;
  originalStoryId?: string | null;
  isOfficial?: boolean;
  status?: string;
  createdAt: Date;
}

interface MapEdgeData {
  id: string;
  source: string;
  target: string;
  category: 'mainline' | 'branch' | 'spinoff';
}

interface HotPathSummary {
  id: string;
  title: string;
  description: string | null;
  creatorName: string;
  viewCount: number;
  startCount: number;
  completionCount: number;
  nodeCount: number;
}

interface UniverseMapResult {
  story: {
    id: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    status: string;
    author: { id: string; username: string; avatarUrl: string | null };
    branchCount: number;
    chapterCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
  nodes: MapNodeData[];
  edges: MapEdgeData[];
  hotPaths: HotPathSummary[];
}

export class MapService {
  static async getUniverseMap(storyId: string): Promise<UniverseMapResult> {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { branches: true, chapters: true } },
      },
    });

    if (!story) {
      throw new AppError(404, 'NOT_FOUND', 'Universe not found');
    }

    // Fetch all data in parallel
    const [chapters, branches, spinoffs, hotReadingPaths] = await Promise.all([
      prisma.chapter.findMany({
        where: { storyId, branchId: null },
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          title: true,
          content: true,
          orderIndex: true,
          isBranchPoint: true,
          createdAt: true,
        },
      }),
      prisma.branch.findMany({
        where: { parentStoryId: storyId },
        include: {
          _count: { select: { chapters: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.spinoff.findMany({
        where: { originalStoryId: storyId },
        select: {
          id: true,
          title: true,
          summary: true,
          type: true,
          status: true,
          isOfficial: true,
          originalStoryId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.readingPath.findMany({
        where: { storyId, status: 'published' },
        orderBy: { viewCount: 'desc' },
        take: 5,
        include: {
          creator: { select: { username: true } },
          _count: { select: { nodes: true } },
        },
      }),
    ]);

    // Build nodes
    const nodes: MapNodeData[] = [
      ...chapters.map((ch) => ({
        id: `chapter-${ch.id}`,
        title: ch.title,
        orderIndex: ch.orderIndex,
        category: 'chapter' as const,
        createdAt: ch.createdAt,
      })),
      ...branches.map((br) => ({
        id: `branch-${br.id}`,
        title: br.title,
        description: br.description,
        category: 'branch' as const,
        parentChapterId: br.parentChapterId,
        parentStoryId: br.parentStoryId,
        isOfficial: br.isOfficial,
        status: br.status,
        createdAt: br.createdAt,
      })),
      ...spinoffs.map((sp) => ({
        id: `spinoff-${sp.id}`,
        title: sp.title,
        description: sp.summary,
        category: 'spinoff' as const,
        originalStoryId: sp.originalStoryId,
        isOfficial: sp.isOfficial,
        status: sp.status,
        createdAt: sp.createdAt,
      })),
    ];

    // Build edges
    const edges: MapEdgeData[] = [];

    // Mainline chapter connections
    for (let i = 0; i < chapters.length; i++) {
      if (i > 0) {
        edges.push({
          id: `edge-main-${chapters[i - 1].id}-${chapters[i].id}`,
          source: `chapter-${chapters[i - 1].id}`,
          target: `chapter-${chapters[i].id}`,
          category: 'mainline',
        });
      }
    }

    // Branch connections (to parent chapter)
    for (const br of branches) {
      if (br.parentChapterId) {
        edges.push({
          id: `edge-branch-${br.id}`,
          source: `chapter-${br.parentChapterId}`,
          target: `branch-${br.id}`,
          category: 'branch',
        });
      }
    }

    // Hot paths summary
    const hotPaths: HotPathSummary[] = hotReadingPaths.map((rp) => ({
      id: rp.id,
      title: rp.title,
      description: rp.description,
      creatorName: rp.creator.username,
      viewCount: rp.viewCount,
      startCount: rp.startCount,
      completionCount: rp.completionCount,
      nodeCount: rp._count.nodes,
    }));

    return {
      story: {
        id: story.id,
        title: story.title,
        description: story.description,
        coverImage: story.coverImage,
        status: story.status,
        author: story.author,
        branchCount: story._count.branches,
        chapterCount: story._count.chapters,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
      },
      nodes,
      edges,
      hotPaths,
    };
  }
}
