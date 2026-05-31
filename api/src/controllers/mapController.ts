import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { MapService } from '../services/MapService';
import { AppError } from '../utils/http';

export const getUniverseMap = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Universe ID is required');
  }
  const data = await MapService.getUniverseMap(id);
  res.json({ success: true, data });
});
