import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const createSpinoff = async (req: AuthRequest, res: Response) => {
  const { originalStoryId, title, content, isOfficial, characterRelationships } = req.body;
  const authorId = req.user?.id;

  if (!authorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const originalStory = await prisma.story.findUnique({ where: { id: originalStoryId } });
    if (!originalStory) return res.status(404).json({ error: 'Not Found', message: 'Original story not found' });

    let finalIsOfficial = false;
    if (isOfficial && (originalStory.authorId === authorId || req.user?.role === 'admin')) {
      finalIsOfficial = true;
    }

    const spinoff = await prisma.spinoff.create({
      data: {
        authorId,
        originalStoryId,
        title,
        content,
        isOfficial: finalIsOfficial,
        characterRelationships: characterRelationships ? JSON.stringify(characterRelationships) : null,
      },
    });

    res.status(201).json(spinoff);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create spinoff' });
  }
};

export const getAllSpinoffs = async (req: Request, res: Response) => {
  try {
    const spinoffs = await prisma.spinoff.findMany({
      include: {
        author: { select: { username: true } },
        originalStory: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(spinoffs);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch spinoffs' });
  }
};

export const getSpinoffById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const spinoff = await prisma.spinoff.findUnique({
      where: { id },
      include: {
        author: { select: { username: true } },
        originalStory: { select: { title: true } },
      }
    });
    if (!spinoff) return res.status(404).json({ error: 'Not Found' });
    res.json(spinoff);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch spinoff' });
  }
};

export const getMySpinoffs = async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const spinoffs = await prisma.spinoff.findMany({
      where: { authorId },
      include: {
        originalStory: { select: { title: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(spinoffs);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch my spinoffs' });
  }
};
