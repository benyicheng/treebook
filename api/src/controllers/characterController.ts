import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';

interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string };
}

// GET /api/characters/:charId/appearances — 查看角色在所有内容中的出场
export const getCharacterAppearances = catchAsync(async (req: Request, res: Response) => {
  const { charId } = req.params;

  // 验证角色存在
  const character = await prisma.character.findUnique({
    where: { id: charId },
    select: { id: true, name: true, storyId: true },
  });
  if (!character) {
    throw new AppError(404, 'CHARACTER_NOT_FOUND', 'Character not found');
  }

  const appearances = await prisma.characterAppearance.findMany({
    where: { characterId: charId },
    orderBy: { createdAt: 'desc' },
  });

  // 解析关联内容类型
  const targetTypes = [...new Set(appearances.map(a => a.targetType))];
  const targetDetails: Record<string, { id: string; title: string; type: string }> = {};

  // 批量查询所有关联内容的标题
  for (const type of targetTypes) {
    const ids = appearances.filter(a => a.targetType === type).map(a => a.targetId);
    if (ids.length === 0) continue;

    let items: { id: string; title: string }[] = [];
    switch (type) {
      case 'chapter':
        items = await prisma.chapter.findMany({ 
          where: { id: { in: ids } }, 
          select: { id: true, title: true } 
        });
        break;
      case 'branch':
        items = await prisma.branch.findMany({ 
          where: { id: { in: ids } }, 
          select: { id: true, title: true } 
        });
        break;
      case 'spinoff':
        items = await prisma.spinoff.findMany({ 
          where: { id: { in: ids } }, 
          select: { id: true, title: true } 
        });
        break;
    }
    for (const item of items) {
      targetDetails[`${type}:${item.id}`] = { id: item.id, title: item.title, type };
    }
  }

  res.json({
    success: true,
    data: {
      character,
      appearances: appearances.map(a => ({
        ...a,
        targetTitle: targetDetails[`${a.targetType}:${a.targetId}`]?.title || 'Unknown',
      })),
    },
  });
});

// POST /api/characters/:charId/appearances — 创建出场记录
export const createCharacterAppearance = catchAsync(async (req: AuthRequest, res: Response) => {
  const { charId } = req.params;
  const { targetType, targetId, appearanceType, note } = req.body;
  const userId = req.user!.id;

  // 验证必填字段
  if (!targetType || !targetId || !appearanceType) {
    throw new AppError(400, 'VALIDATION_ERROR', 'targetType, targetId, and appearanceType are required');
  }

  // 验证 appearanceType 可选值
  const validAppearanceTypes = ['appears', 'main_focus', 'mention', 'cameo'];
  if (!validAppearanceTypes.includes(appearanceType)) {
    throw new AppError(400, 'VALIDATION_ERROR', `appearanceType must be one of: ${validAppearanceTypes.join(', ')}`);
  }

  // 验证 targetType 可选值
  const validTargetTypes = ['chapter', 'branch', 'spinoff'];
  if (!validTargetTypes.includes(targetType)) {
    throw new AppError(400, 'VALIDATION_ERROR', `targetType must be one of: ${validTargetTypes.join(', ')}`);
  }

  // 验证角色存在
  const character = await prisma.character.findUnique({
    where: { id: charId },
    select: { id: true, storyId: true },
  });
  if (!character) {
    throw new AppError(404, 'CHARACTER_NOT_FOUND', 'Character not found');
  }

  // 验证目标内容存在
  let targetExists = false;
  switch (targetType) {
    case 'chapter':
      targetExists = !!(await prisma.chapter.findUnique({ where: { id: targetId }, select: { id: true } }));
      break;
    case 'branch':
      targetExists = !!(await prisma.branch.findUnique({ where: { id: targetId }, select: { id: true } }));
      break;
    case 'spinoff':
      targetExists = !!(await prisma.spinoff.findUnique({ where: { id: targetId }, select: { id: true } }));
      break;
  }
  if (!targetExists) {
    throw new AppError(404, 'TARGET_NOT_FOUND', `${targetType} with id ${targetId} not found`);
  }

  // 权限检查：验证用户是目标内容的作者或 admin
  const isAdmin = req.user!.role === 'admin';
  if (!isAdmin) {
    let isAuthor = false;
    switch (targetType) {
      case 'chapter': {
        const chapter = await prisma.chapter.findUnique({
          where: { id: targetId },
          select: { story: { select: { authorId: true } } },
        });
        isAuthor = chapter?.story?.authorId === userId;
        break;
      }
      case 'branch': {
        const branch = await prisma.branch.findUnique({
          where: { id: targetId },
          select: { authorId: true },
        });
        isAuthor = branch?.authorId === userId;
        break;
      }
      case 'spinoff': {
        const spinoff = await prisma.spinoff.findUnique({
          where: { id: targetId },
          select: { authorId: true },
        });
        isAuthor = spinoff?.authorId === userId;
        break;
      }
    }
    if (!isAuthor) {
      throw new AppError(403, 'FORBIDDEN', 'You are not the author of this content');
    }
  }

  // 检查是否已存在（unique constraint）
  const existing = await prisma.characterAppearance.findUnique({
    where: {
      characterId_targetType_targetId: {
        characterId: charId,
        targetType,
        targetId,
      },
    },
  });
  if (existing) {
    throw new AppError(409, 'DUPLICATE', 'This character already has an appearance record for this content');
  }

  const appearance = await prisma.characterAppearance.create({
    data: {
      characterId: charId,
      targetType,
      targetId,
      appearanceType,
      note: note || null,
    },
  });

  res.status(201).json({ success: true, data: appearance });
});

// DELETE /api/characters/:charId/appearances/:id — 删除出场记录
export const deleteCharacterAppearance = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const appearance = await prisma.characterAppearance.findUnique({
    where: { id },
    select: { id: true, targetType: true, targetId: true, characterId: true },
  });
  if (!appearance) {
    throw new AppError(404, 'NOT_FOUND', 'Appearance record not found');
  }

  // 权限检查
  const isAdmin = req.user!.role === 'admin';
  if (!isAdmin) {
    let isAuthor = false;
    switch (appearance.targetType) {
      case 'chapter': {
        const chapter = await prisma.chapter.findUnique({
          where: { id: appearance.targetId },
          select: { story: { select: { authorId: true } } },
        });
        isAuthor = chapter?.story?.authorId === userId;
        break;
      }
      case 'branch': {
        const branch = await prisma.branch.findUnique({
          where: { id: appearance.targetId },
          select: { authorId: true },
        });
        isAuthor = branch?.authorId === userId;
        break;
      }
      case 'spinoff': {
        const spinoff = await prisma.spinoff.findUnique({
          where: { id: appearance.targetId },
          select: { authorId: true },
        });
        isAuthor = spinoff?.authorId === userId;
        break;
      }
    }
    if (!isAuthor) {
      throw new AppError(403, 'FORBIDDEN', 'You are not the author of this content');
    }
  }

  await prisma.characterAppearance.delete({ where: { id } });

  res.json({ success: true, message: 'Appearance record deleted' });
});
