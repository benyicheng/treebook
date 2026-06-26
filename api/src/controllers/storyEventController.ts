import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { StoryEventService } from '../services/StoryEventService';
import { getCurrentUser } from '../utils/authHelpers';

export const createEvent = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId, role: userRole } = getCurrentUser(req);
  const { storyId, title, description, type, importance, color, sortOrder, nodes } = req.body;

  const event = await StoryEventService.create(
    authorId,
    userRole,
    { storyId, title, description, type, importance, color, sortOrder, nodes },
  );
  res.status(201).json({ success: true, data: event });
});

export const listEvents = catchAsync(async (req: Request, res: Response) => {
  const q = req.query.q as string | undefined;
  const events = await StoryEventService.list(q);
  res.json({ success: true, data: events });
});

export const getEventsByStory = catchAsync(async (req: Request, res: Response) => {
  const { storyId } = req.params;
  const events = await StoryEventService.getByStory(storyId);
  res.json({ success: true, data: events });
});

export const getEventById = catchAsync(async (req: Request, res: Response) => {
  const event = await StoryEventService.getById(req.params.id);
  res.json({ success: true, data: event });
});

export const updateEvent = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId, role: userRole } = getCurrentUser(req);
  const event = await StoryEventService.update(req.params.id, authorId, userRole, req.body);
  res.json({ success: true, data: event });
});

export const deleteEvent = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId, role: userRole } = getCurrentUser(req);
  const result = await StoryEventService.delete(req.params.id, authorId, userRole);
  res.json({ success: true, data: result });
});

export const addNode = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId, role: userRole } = getCurrentUser(req);
  const { eventId } = req.params;
  const { targetType, targetId, sortOrder, note } = req.body;

  const node = await StoryEventService.addNode(eventId, authorId, userRole, {
    targetType,
    targetId,
    sortOrder,
    note,
  });
  res.status(201).json({ success: true, data: node });
});

export const removeNode = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId, role: userRole } = getCurrentUser(req);
  const result = await StoryEventService.removeNode(req.params.nodeId, authorId, userRole);
  res.json({ success: true, data: result });
});

export const reorderNodes = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId, role: userRole } = getCurrentUser(req);
  const { eventId } = req.params;
  const { nodeIds } = req.body;
  if (!Array.isArray(nodeIds)) throw new Error('缺少 nodeIds 数组');

  const nodes = await StoryEventService.reorderNodes(eventId, authorId, userRole, nodeIds);
  res.json({ success: true, data: nodes });
});
