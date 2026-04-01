import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { SpinoffService } from '../services/SpinoffService';
import { AppError } from '../utils/http';

export const createSpinoff = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const spinoff = await SpinoffService.createSpinoff(authorId, req.body);
  res.status(201).json({ success: true, data: spinoff });
});

export const getSpinoffById = catchAsync(async (req: Request, res: Response) => {
  const spinoff = await SpinoffService.getSpinoffById(req.params.id);
  res.json({ success: true, data: spinoff });
});

export const getAllSpinoffs = catchAsync(async (req: Request, res: Response) => {
  const spinoffs = await SpinoffService.getAllSpinoffs(req.query);
  res.json({ success: true, data: spinoffs });
});

export const updateSpinoff = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const spinoff = await SpinoffService.updateSpinoff(req.params.id, authorId, userRole, req.body);
  res.json({ success: true, data: spinoff });
});

export const getMySpinoffs = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const spinoffs = await SpinoffService.getMySpinoffs(authorId);
  res.json({ success: true, data: spinoffs });
});

export const deleteSpinoff = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await SpinoffService.deleteSpinoff(req.params.id, authorId, userRole);
  res.json(result);
});
