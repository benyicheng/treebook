import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const createBranch = async (req: AuthRequest, res: Response) => {
  const { parentStoryId, parentChapterId, title, description, branchType, conditions, isOfficial } = req.body;
  const authorId = req.user?.id;

  if (!authorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const parentStory = await prisma.story.findUnique({ where: { id: parentStoryId } });
    if (!parentStory) return res.status(404).json({ error: 'Not Found', message: 'Parent story not found' });

    // Official status can only be set by the original author of the story or an admin
    let finalIsOfficial = false;
    if (isOfficial && (parentStory.authorId === authorId || req.user?.role === 'admin')) {
      finalIsOfficial = true;
    }

    const branch = await prisma.branch.create({
      data: {
        parentStoryId,
        parentChapterId,
        authorId,
        title,
        description,
        branchType: branchType || 'parallel',
        isOfficial: finalIsOfficial,
        conditions: conditions ? JSON.stringify(conditions) : null,
      },
    });

    // Increment branchCount in the parent story
    await prisma.story.update({
      where: { id: parentStoryId },
      data: { branchCount: { increment: 1 } }
    });

    res.status(201).json(branch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create branch' });
  }
};

export const getBranches = async (req: Request, res: Response) => {
  try {
    const limitParam = req.query.limit;
    const limit = limitParam ? parseInt(limitParam as string) : undefined;

    const branches = await prisma.branch.findMany({
      include: {
        author: {
          select: { username: true, role: true }
        },
        parentStory: {
          select: { title: true, coverImage: true }
        },
        _count: {
          select: { chapters: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch branches' });
  }
};

export const getBranchById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        author: {
          select: { username: true, role: true }
        },
        chapters: {
          orderBy: { orderIndex: 'asc' }
        },
        parentStory: {
          include: {
            spinoffs: {
              include: {
                author: {
                  select: { username: true },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        parentChapter: true,
      }
    });

    if (!branch) return res.status(404).json({ error: 'Not Found', message: 'Branch not found' });

    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch branch' });
  }
};

export const updateBranch = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, branchType, conditions, isOfficial } = req.body;
  const authorId = req.user?.id;

  try {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: { parentStory: true }
    });

    if (!branch) return res.status(404).json({ error: 'Not Found', message: 'Branch not found' });

    // 权限检查：分支作者、主线故事作者或管理员可以更新分支
    const hasPermission = 
      branch.authorId === authorId || 
      branch.parentStory.authorId === authorId ||
      req.user?.role === 'admin';

    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden', message: 'Not authorized to update this branch' });
    }

    // Official status check
    let finalIsOfficial = branch.isOfficial;
    if (isOfficial !== undefined && (branch.parentStory.authorId === authorId || req.user?.role === 'admin')) {
      finalIsOfficial = isOfficial;
    }

    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        title,
        description,
        branchType,
        conditions: conditions ? JSON.stringify(conditions) : branch.conditions,
        isOfficial: finalIsOfficial,
      },
    });

    res.json(updatedBranch);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update branch' });
  }
};

export const getMyBranches = async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const branches = await prisma.branch.findMany({
      where: { authorId },
      include: {
        parentStory: {
          select: { title: true }
        },
        _count: {
          select: { chapters: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch my branches' });
  }
};

export const deleteBranch = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const authorId = req.user?.id;

  if (!authorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: { parentStory: true }
    });

    if (!branch) return res.status(404).json({ error: 'Not Found', message: 'Branch not found' });

    // 权限检查：分支作者、主线故事作者或管理员可以删除分支
    const hasPermission = 
      branch.authorId === authorId || 
      branch.parentStory.authorId === authorId ||
      req.user?.role === 'admin';

    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden', message: 'Not authorized to delete this branch' });
    }

    // 删除分支（关联的章节会自动删除，因为设置了 onDelete: Cascade）
    await prisma.branch.delete({ where: { id } });

    // 减少主线故事的分支计数
    await prisma.story.update({
      where: { id: branch.parentStoryId },
      data: { branchCount: { decrement: 1 } }
    });

    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete branch' });
  }
};
