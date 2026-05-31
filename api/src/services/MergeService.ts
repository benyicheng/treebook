import { prisma } from '../prisma';
import { AppError } from '../utils/http';

interface MergeConflict {
  type: 'content_overlap' | 'structure_conflict' | 'naming_collision';
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface MergePreview {
  branchTitle: string;
  branchAuthor: string;
  targetChapterTitle: string;
  branchChapters: Array<{ id: string; title: string; orderIndex: number }>;
  conflicts: MergeConflict[];
  mergeStrategy: 'append' | 'insert_after' | 'replace';
}

export class MergeService {
  static async createMergeRequest(userId: string, data: any) {
    const { branchId, spinoffId, storyId, message, type = 'branch_merge' } = data;

    if (type === 'branch_merge') {
      if (!branchId) throw new AppError(400, 'BAD_REQUEST', '缺少分支ID');
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch || branch.authorId !== userId) {
        throw new AppError(403, 'FORBIDDEN', '你没有权限为此分支发起合并请求');
      }
      const existing = await prisma.mergeRequest.findFirst({
        where: { branchId, status: 'pending' }
      });
      if (existing) throw new AppError(400, 'BAD_REQUEST', '该分支已有挂起的合并请求');

      return prisma.mergeRequest.create({
        data: { type, branchId, storyId, message, status: 'pending' }
      });
    } 
    
    if (type === 'spinoff_official') {
      if (!spinoffId) throw new AppError(400, 'BAD_REQUEST', '缺少番外ID');
      const spinoff = await prisma.spinoff.findUnique({ where: { id: spinoffId } });
      if (!spinoff || spinoff.authorId !== userId) {
        throw new AppError(403, 'FORBIDDEN', '你没有权限为此番外发起认证请求');
      }
      const existing = await prisma.mergeRequest.findFirst({
        where: { spinoffId, status: 'pending' }
      });
      if (existing) throw new AppError(400, 'BAD_REQUEST', '该番外已有挂起的认证请求');

      return prisma.mergeRequest.create({
        data: { type, spinoffId, storyId, message, status: 'pending' }
      });
    }

    throw new AppError(400, 'BAD_REQUEST', '无效的请求类型');
  }

  static async getMergeRequests(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new AppError(404, 'NOT_FOUND', '故事不存在');

    const isOriginalAuthor = story.authorId === userId;

    const requests = await prisma.mergeRequest.findMany({
      where: { storyId },
      include: {
        branch: { include: { author: { select: { id: true, username: true } } } },
        spinoff: { include: { author: { select: { id: true, username: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return isOriginalAuthor 
      ? requests 
      : requests.filter(r => 
          (r.branch?.authorId === userId) || (r.spinoff?.authorId === userId)
        );
  }

  /**
   * Preview a merge: detect conflicts and return a summary.
   */
  static async previewMerge(requestId: string): Promise<MergePreview> {
    const mergeRequest = await prisma.mergeRequest.findUnique({
      where: { id: requestId },
      include: {
        story: true,
        branch: {
          include: {
            author: { select: { username: true } },
            chapters: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    if (!mergeRequest) throw new AppError(404, 'NOT_FOUND', '请求不存在');

    if (mergeRequest.type !== 'branch_merge' || !mergeRequest.branch) {
      throw new AppError(400, 'BAD_REQUEST', '仅支持分支合并预览');
    }

    const branch = mergeRequest.branch;
    const story = mergeRequest.story;

    // Get the parent chapter where this branch forked
    const parentChapter = await prisma.chapter.findUnique({
      where: { id: branch.parentChapterId },
      include: {
        story: true,
      },
    });

    if (!parentChapter) {
      throw new AppError(404, 'NOT_FOUND', '分支父章节不存在');
    }

    // Get mainline chapters after the fork point
    const mainlineChapters = await prisma.chapter.findMany({
      where: {
        storyId: story.id,
        branchId: null, // Only mainline chapters
        orderIndex: { gt: parentChapter.orderIndex },
      },
      orderBy: { orderIndex: 'asc' },
    });

    const conflicts: MergeConflict[] = [];

    // Check for content overlap: same titles
    for (const branchCh of branch.chapters) {
      const overlap = mainlineChapters.find(
        (mc) => mc.title.toLowerCase() === branchCh.title.toLowerCase()
      );
      if (overlap) {
        conflicts.push({
          type: 'content_overlap',
          description: `章节标题冲突: "${branchCh.title}" 已在主线中存在 (第 ${overlap.orderIndex} 章)`,
          severity: 'high',
        });
      }
    }

    // Check for naming collision with existing mainline chapters
    const mainlineTitles = new Set(mainlineChapters.map((c) => c.title.toLowerCase()));
    for (const ch of branch.chapters) {
      if (mainlineTitles.has(ch.title.toLowerCase())) {
        conflicts.push({
          type: 'naming_collision',
          description: `命名冲突: 分支章节 "${ch.title}" 与主线章节同名`,
          severity: 'medium',
        });
      }
    }

    // Determine merge strategy
    let mergeStrategy: 'append' | 'insert_after' | 'replace' = 'insert_after';

    if (branch.chapters.length > 0 && mainlineChapters.length === 0) {
      // No mainline chapters after fork — straightforward append
      mergeStrategy = 'append';
    } else if (conflicts.some((c) => c.severity === 'high')) {
      // Has conflicts — suggest manual replacement
      mergeStrategy = 'replace';
    }

    return {
      branchTitle: branch.title,
      branchAuthor: branch.author.username,
      targetChapterTitle: parentChapter.title,
      branchChapters: branch.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        orderIndex: ch.orderIndex,
      })),
      conflicts,
      mergeStrategy,
    };
  }

  /**
   * Perform the actual content merge for an approved branch merge.
   * Copies branch chapters into the mainline as new chapters.
   */
  static async performContentMerge(mergeRequest: {
    id: string;
    branchId?: string | null;
    storyId: string;
    branch?: { parentChapterId: string; chapters: Array<{ id: string; title: string; content: string; orderIndex: number }> } | null;
  }) {
    if (!mergeRequest.branchId || !mergeRequest.branch) return;

    const branch = mergeRequest.branch;

    // Get the parent chapter's orderIndex
    const parentChapter = await prisma.chapter.findUnique({
      where: { id: branch.parentChapterId },
    });
    if (!parentChapter) return;

    // Shift existing chapters after the fork point to make room
    const chaptersAfter = await prisma.chapter.findMany({
      where: {
        storyId: mergeRequest.storyId,
        branchId: null,
        orderIndex: { gt: parentChapter.orderIndex },
      },
      orderBy: { orderIndex: 'desc' }, // Process from end to avoid index conflicts
    });

    // Shift by the number of branch chapters being inserted
    const shiftAmount = branch.chapters.length;

    for (const ch of chaptersAfter) {
      await prisma.chapter.update({
        where: { id: ch.id },
        data: { orderIndex: ch.orderIndex + shiftAmount },
      });
    }

    // Insert branch chapters into mainline
    for (let i = 0; i < branch.chapters.length; i++) {
      const branchCh = branch.chapters[i];
      await prisma.chapter.create({
        data: {
          storyId: mergeRequest.storyId,
          title: branchCh.title,
          content: branchCh.content,
          orderIndex: parentChapter.orderIndex + 1 + i,
          isBranchPoint: false,
        },
      });
    }
  }

  static async handleMergeRequest(requestId: string, userId: string, data: { status: 'approved' | 'rejected', reviewComment?: string }) {
    const { status, reviewComment } = data;

    const mergeRequest = await prisma.mergeRequest.findUnique({
      where: { id: requestId },
      include: {
        story: true,
        branch: {
          include: {
            author: { select: { id: true, username: true } },
            chapters: true,
          },
        },
        spinoff: true,
      },
    });

    if (!mergeRequest) throw new AppError(404, 'NOT_FOUND', '请求不存在');
    if (mergeRequest.story.authorId !== userId) {
      throw new AppError(403, 'FORBIDDEN', '只有故事原作者可以审核请求');
    }

    if (status === 'approved') {
      if (mergeRequest.type === 'branch_merge' && mergeRequest.branchId) {
        // Perform content merge: copy branch chapters into mainline
        await MergeService.performContentMerge(mergeRequest);

        await prisma.$transaction([
          prisma.branch.update({
            where: { id: mergeRequest.branchId },
            data: { isOfficial: true, status: 'merged' },
          }),
          prisma.mergeRequest.update({
            where: { id: requestId },
            data: { status: 'approved', reviewComment },
          }),
        ]);

        // Create activity for content merge
        await prisma.activity.create({
          data: {
            actorId: userId,
            type: 'merge_approved',
            targetType: 'branch',
            targetId: mergeRequest.branchId,
            metadata: JSON.stringify({
              branchTitle: mergeRequest.branch?.title,
              storyTitle: mergeRequest.story.title,
              chaptersMerged: mergeRequest.branch?.chapters.length || 0,
            }),
          },
        });
      } else if (mergeRequest.type === 'spinoff_official' && mergeRequest.spinoffId) {
        // 执行番外转正：将番外内容创建为故事的正式章节
        const spinoff = await prisma.spinoff.findUnique({
          where: { id: mergeRequest.spinoffId },
          include: { author: { select: { id: true, username: true } } },
        });
        if (!spinoff) throw new AppError(404, 'NOT_FOUND', '番外不存在');

        // 获取故事当前最大章节 orderIndex
        const lastChapter = await prisma.chapter.findFirst({
          where: { storyId: mergeRequest.storyId, branchId: null },
          orderBy: { orderIndex: 'desc' },
        });
        const nextOrder = (lastChapter?.orderIndex ?? 0) + 1;

        // 创建正式章节，内容来自番外
        await prisma.chapter.create({
          data: {
            storyId: mergeRequest.storyId,
            title: spinoff.title,
            content: spinoff.content,
            orderIndex: nextOrder,
            branchId: null,
            isBranchPoint: false,
          },
        });

        await prisma.$transaction([
          prisma.spinoff.update({
            where: { id: mergeRequest.spinoffId },
            data: { isOfficial: true, status: 'merged' },
          }),
          prisma.mergeRequest.update({
            where: { id: requestId },
            data: { status: 'approved', reviewComment },
          }),
        ]);

        // Create activity for spinoff certification
        await prisma.activity.create({
          data: {
            actorId: userId,
            type: 'merge_approved',
            targetType: 'spinoff',
            targetId: mergeRequest.spinoffId,
            metadata: JSON.stringify({
              spinoffTitle: mergeRequest.spinoff?.title,
              storyTitle: mergeRequest.story.title,
            }),
          },
        });
      }
    } else {
      await prisma.mergeRequest.update({
        where: { id: requestId },
        data: { status: 'rejected', reviewComment },
      });
    }

    return { success: true, message: `请求已${status === 'approved' ? '通过' : '拒绝'}` };
  }
}
