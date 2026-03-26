import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAllStories = async (req: Request, res: Response) => {
  const { isOfficial, tag } = req.query;

  try {
    const where: any = {};
    if (tag) {
      where.tags = {
        some: {
          name: tag as string
        }
      };
    }

    if (typeof isOfficial === 'string') {
      const v = isOfficial.toLowerCase();
      if (v === 'true' || v === '1') {
        where.author = { role: { in: ['author', 'admin'] } };
      } else if (v === 'false' || v === '0') {
        where.author = { role: { in: ['reader'] } };
      }
    }
    
    const stories = await prisma.story.findMany({
      where,
      include: {
        author: {
          select: {
            username: true,
            role: true,
          },
        },
        tags: true,
        _count: {
          select: {
            branches: true,
            chapters: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(stories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch stories' });
  }
};

export const getStoryById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            username: true,
            role: true,
          },
        },
        tags: true,
        chapters: {
          where: { branchId: null }, // 只查询主线章节，不显示分支章节
          orderBy: { orderIndex: 'asc' },
        },
        branches: {
          include: {
            author: {
              select: {
                username: true,
                role: true,
              },
            },
            parentChapter: {
              select: {
                id: true,
                title: true,
                orderIndex: true,
              },
            },
            _count: {
              select: { chapters: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        spinoffs: {
          include: {
            author: {
              select: { username: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!story) {
      return res.status(404).json({ error: 'Not Found', message: 'Story not found' });
    }

    res.json(story);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch story' });
  }
};

export const createStory = async (req: AuthRequest, res: Response) => {
  const { title, description, coverImage, metadata, tags } = req.body;
  const authorId = req.user?.id;

  if (!authorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const story = await prisma.story.create({
      data: {
        title,
        description,
        coverImage,
        metadata: metadata ? JSON.stringify(metadata) : null,
        authorId,
        tags: tags ? {
          connectOrCreate: tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag }
          }))
        } : undefined
      },
      include: { tags: true }
    });

    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create story' });
  }
};

export const updateStory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, coverImage, status, metadata, tags } = req.body;
  const authorId = req.user?.id;

  try {
    const story = await prisma.story.findUnique({ where: { id }, include: { tags: true } });

    if (!story) {
      return res.status(404).json({ error: 'Not Found', message: 'Story not found' });
    }

    if (story.authorId !== authorId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Not authorized to update this story' });
    }

    const updatedStory = await prisma.story.update({
      where: { id },
      data: {
        title,
        description,
        coverImage,
        status,
        metadata: metadata ? JSON.stringify(metadata) : story.metadata,
        tags: tags ? {
          set: [], // Disconnect all existing tags
          connectOrCreate: tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag }
          }))
        } : undefined
      },
      include: { tags: true }
    });

    res.json(updatedStory);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update story' });
  }
};

export const deleteStory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const authorId = req.user?.id;

  try {
    const story = await prisma.story.findUnique({ where: { id } });

    if (!story) {
      return res.status(404).json({ error: 'Not Found', message: 'Story not found' });
    }

    if (story.authorId !== authorId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Not authorized to delete this story' });
    }

    await prisma.story.delete({ where: { id } });
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete story' });
  }
};

export const getRecentReads = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const history = await prisma.readingHistory.findMany({
      where: { userId },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            story: {
              select: {
                id: true,
                title: true,
                coverImage: true
              }
            },
            branch: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: { readAt: 'desc' },
      take: 5
    });
    
    // Flatten structure for easier consumption
    const recentReads = history.map(item => ({
      ...item.chapter,
      readAt: item.readAt,
      progress: item.progress
    }));
    
    res.json(recentReads);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch reading history' });
  }
};

export const getMyStories = async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const stories = await prisma.story.findMany({
      where: { authorId },
      include: {
        tags: true,
        _count: {
          select: {
            branches: true,
            chapters: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch my stories' });
  }
};

export const getStoryCharacters = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const characters = await prisma.character.findMany({
      where: { storyId: id },
      orderBy: { createdAt: 'asc' }
    });
    res.json(characters);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch characters' });
  }
};

export const createCharacter = async (req: AuthRequest, res: Response) => {
  const { id: storyId } = req.params;
  const { name, description, avatarUrl, role, attributes } = req.body;
  const authorId = req.user?.id;

  try {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) return res.status(404).json({ error: 'Not Found' });
    if (story.authorId !== authorId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const character = await prisma.character.create({
      data: {
        storyId,
        name,
        description,
        avatarUrl,
        role: role || 'supporting',
        attributes: attributes ? JSON.stringify(attributes) : null
      }
    });
    res.status(201).json(character);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create character' });
  }
};

export const updateCharacter = async (req: AuthRequest, res: Response) => {
  const { charId } = req.params;
  const { name, description, avatarUrl, role, attributes } = req.body;
  const authorId = req.user?.id;

  try {
    const character = await prisma.character.findUnique({
      where: { id: charId },
      include: { story: true }
    });

    if (!character) return res.status(404).json({ error: 'Not Found' });
    if (character.story.authorId !== authorId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.character.update({
      where: { id: charId },
      data: {
        name,
        description,
        avatarUrl,
        role,
        attributes: attributes ? JSON.stringify(attributes) : character.attributes
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update character' });
  }
};

export const getTags = async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { stories: true }
        }
      },
      orderBy: {
        stories: {
          _count: 'desc'
        }
      },
      take: 20
    });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch tags' });
  }
};

export const deleteCharacter = async (req: AuthRequest, res: Response) => {
  const { charId } = req.params;
  const authorId = req.user?.id;

  try {
    const character = await prisma.character.findUnique({
      where: { id: charId },
      include: { story: true }
    });

    if (!character) return res.status(404).json({ error: 'Not Found' });
    if (character.story.authorId !== authorId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.character.delete({ where: { id: charId } });
    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete character' });
  }
};
