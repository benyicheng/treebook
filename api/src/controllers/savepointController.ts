import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { SavepointService } from '../services/SavepointService';
import { AppError } from '../utils/http';
import { getCurrentUser } from '../utils/authHelpers';

export const createSavepoint = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const savepoint = await SavepointService.createSavepoint(userId, req.body);
  res.status(201).json({ success: true, data: savepoint });
});

export const getUserSavepoints = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const savepoints = await SavepointService.getUserSavepoints(userId, req.query.storyId as string);
  res.json({ success: true, data: savepoints });
});

export const deleteSavepoint = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const result = await SavepointService.deleteSavepoint(req.params.id, userId);
  res.json({ success: true, data: result });
});
