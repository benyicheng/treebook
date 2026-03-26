import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const createChapter = async (req: AuthRequest, res: Response) => {
  const { storyId, branchId, title, content, orderIndex, isBranchPoint, characterData } = req.body;
  const authorId = req.user?.id;

  if (!authorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) return res.status(404).json({ error: 'Not Found', message: 'Story not found' });

    // 权限检查逻辑：
    // 1. 主线故事作者可以创建任何章节
    // 2. 分支作者可以创建自己分支的章节
    // 3. 管理员可以创建任何章节
    let hasPermission = false;

    if (story.authorId === authorId || req.user?.role === 'admin') {
      hasPermission = true;
    } else if (branchId) {
      // 如果是分支章节，检查是否是分支作者
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (branch && branch.authorId === authorId) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden', message: 'Not authorized to add chapters to this story/branch' });
    }

    const chapter = await prisma.chapter.create({
      data: {
        storyId,
        branchId,
        title,
        content,
        orderIndex,
        isBranchPoint: isBranchPoint || false,
        characterData: characterData ? JSON.stringify(characterData) : null,
      },
    });

    res.status(201).json(chapter);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create chapter' });
  }
};

export const updateChapter = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, orderIndex, isBranchPoint, characterData } = req.body;
  const authorId = req.user?.id;

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: { story: true }
    });

    if (!chapter) return res.status(404).json({ error: 'Not Found', message: 'Chapter not found' });

    // Check permissions
    if (chapter.story.authorId !== authorId) {
      const collaboration = await prisma.collaboration.findFirst({
        where: { storyId: chapter.storyId, userId: authorId, status: 'approved' }
      });
      if (!collaboration && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const updatedChapter = await prisma.chapter.update({
      where: { id },
      data: {
        title,
        content,
        orderIndex,
        isBranchPoint,
        characterData: characterData ? JSON.stringify(characterData) : chapter.characterData,
      },
    });

    res.json(updatedChapter);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update chapter' });
  }
};

export const deleteChapter = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const authorId = req.user?.id;

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: { story: true }
    });

    if (!chapter) return res.status(404).json({ error: 'Not Found', message: 'Chapter not found' });

    if (chapter.story.authorId !== authorId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.chapter.delete({ where: { id } });
    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete chapter' });
  }
};

export const getChapterById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            author: { select: { username: true } }
          }
        },
        branch: {
          select: {
            id: true,
            title: true,
            author: { select: { username: true } }
          }
        },
        branchesFrom: {
          select: {
            id: true,
            title: true,
            description: true,
            isOfficial: true,
            viewCount: true,
            author: { select: { username: true } },
            _count: { select: { chapters: true } },
          }
        }
      }
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Not Found', message: 'Chapter not found' });
    }

    const userId = (req as any).user?.id;
    if (userId) {
      await prisma.readingHistory.upsert({
        where: {
          userId_chapterId: { userId, chapterId: id }
        },
        update: { readAt: new Date() },
        create: { userId, chapterId: id }
      });
    }

    // 增加浏览量统计
    await prisma.interactionStat.upsert({
      where: { targetType_targetId: { targetType: 'chapter', targetId: id } },
      create: { targetType: 'chapter', targetId: id, viewCount: 1 },
      update: { viewCount: { increment: 1 } },
    });
    
    // 获取最新的浏览量和评论数
    const viewStat = await prisma.interactionStat.findUnique({
      where: { targetType_targetId: { targetType: 'chapter', targetId: id } },
      select: { viewCount: true }
    });
    
    const commentCount = await prisma.comment.count({
      where: { chapterId: id }
    });

    // Get next and previous chapters in the same series (mainline or branch)
    const nextChapter = await prisma.chapter.findFirst({
      where: {
        storyId: chapter.storyId,
        branchId: chapter.branchId,
        orderIndex: chapter.orderIndex + 1
      },
      select: { id: true, title: true }
    });

    const prevChapter = await prisma.chapter.findFirst({
      where: {
        storyId: chapter.storyId,
        branchId: chapter.branchId,
        orderIndex: chapter.orderIndex - 1
      },
      select: { id: true, title: true }
    });

    res.json({
      ...chapter,
      nextChapter,
      prevChapter,
      viewCount: viewStat?.viewCount || 0,
      commentCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch chapter' });
  }
};

export const getComments = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const comments = await prisma.comment.findMany({
      where: { chapterId: id },
      include: {
        author: {
          select: { username: true, avatarUrl: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch comments' });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const authorId = req.user?.id;

  if (!authorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        chapterId: id,
        authorId
      },
      include: {
        author: {
          select: { username: true, avatarUrl: true, role: true }
        }
      }
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create comment' });
  }
};
