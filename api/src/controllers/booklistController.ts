import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const createBooklist = async (req: AuthRequest, res: Response) => {
  const { title, description, isPublic, items } = req.body;
  const creatorId = req.user?.id;

  if (!creatorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const booklist = await prisma.booklist.create({
      data: {
        title,
        description,
        isPublic: isPublic !== undefined ? isPublic : true,
        creatorId,
        items: {
          create: items?.map((item: any) => ({
            chapterId: item.chapterId,
            orderIndex: item.orderIndex,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json(booklist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create booklist' });
  }
};

export const getBooklists = async (req: Request, res: Response) => {
  try {
    const limitParam = req.query.limit;
    const limit = limitParam ? parseInt(limitParam as string) : undefined;
    const sortBy = (req.query.sortBy as string) || 'createdAt';

    const orderBy: any = {};
    if (sortBy === 'hot') {
      orderBy.viewCount = 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const booklists = await prisma.booklist.findMany({
      where: { isPublic: true },
      include: {
        creator: {
          select: { username: true, role: true }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy,
      take: limit,
    });

    res.json(booklists);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch booklists' });
  }
};

export const getBooklistById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const booklist = await prisma.booklist.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, username: true, role: true }
        },
        items: {
          include: {
            chapter: {
              include: {
                story: {
                  include: {
                    author: {
                      select: { username: true, role: true }
                    }
                  }
                },
                branch: true,
              }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!booklist) return res.status(404).json({ error: 'Not Found', message: 'Booklist not found' });

    res.json(booklist);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch booklist' });
  }
};

export const updateBooklist = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, isPublic, items } = req.body;
  const creatorId = req.user?.id;

  try {
    const booklist = await prisma.booklist.findUnique({ where: { id } });

    if (!booklist) return res.status(404).json({ error: 'Not Found', message: 'Booklist not found' });

    if (booklist.creatorId !== creatorId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Update booklist info and potentially items
    const updatedBooklist = await prisma.booklist.update({
      where: { id },
      data: {
        title,
        description,
        isPublic,
        // (Simplification: just replace items for now)
        items: items ? {
          deleteMany: {},
          create: items.map((item: any) => ({
            chapterId: item.chapterId,
            orderIndex: item.orderIndex,
            notes: item.notes,
          })),
        } : undefined,
      },
      include: { items: true }
    });

    res.json(updatedBooklist);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update booklist' });
  }
};

export const getMyBooklists = async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  if (!creatorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const booklists = await prisma.booklist.findMany({
      where: { creatorId },
      include: {
        _count: { select: { items: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(booklists);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch booklists' });
  }
};

export const addChapterToBooklist = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // booklist id
  const { chapterId, notes } = req.body;
  const creatorId = req.user?.id;

  if (!creatorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const booklist = await prisma.booklist.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!booklist) return res.status(404).json({ error: 'Not Found', message: 'Booklist not found' });
    if (booklist.creatorId !== creatorId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if chapter already in booklist
    const existing = booklist.items.find(item => item.chapterId === chapterId);
    if (existing) {
      return res.status(400).json({ error: 'Bad Request', message: 'Chapter already in booklist' });
    }

    const maxOrderIndex = booklist.items.reduce((max, item) => Math.max(max, item.orderIndex), 0);

    const newItem = await prisma.booklistItem.create({
      data: {
        booklistId: id,
        chapterId,
        orderIndex: maxOrderIndex + 1,
        notes,
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to add item to booklist' });
  }
};

export const deleteBooklist = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const creatorId = req.user?.id;

  if (!creatorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const booklist = await prisma.booklist.findUnique({ where: { id } });

    if (!booklist) return res.status(404).json({ error: 'Not Found', message: 'Booklist not found' });
    if (booklist.creatorId !== creatorId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.booklist.delete({ where: { id } });

    res.json({ message: 'Booklist deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete booklist' });
  }
};

export const updateBooklistItem = async (req: AuthRequest, res: Response) => {
  const { id, itemId } = req.params;
  const { notes, orderIndex } = req.body;
  const creatorId = req.user?.id;

  if (!creatorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const booklist = await prisma.booklist.findUnique({ where: { id } });

    if (!booklist) return res.status(404).json({ error: 'Not Found', message: 'Booklist not found' });
    if (booklist.creatorId !== creatorId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedItem = await prisma.booklistItem.update({
      where: { id: itemId },
      data: {
        notes,
        orderIndex,
      }
    });

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update booklist item' });
  }
};

export const removeBooklistItem = async (req: AuthRequest, res: Response) => {
  const { id, itemId } = req.params;
  const creatorId = req.user?.id;

  if (!creatorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const booklist = await prisma.booklist.findUnique({ where: { id } });

    if (!booklist) return res.status(404).json({ error: 'Not Found', message: 'Booklist not found' });
    if (booklist.creatorId !== creatorId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.booklistItem.delete({ where: { id: itemId } });

    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to remove booklist item' });
  }
};
