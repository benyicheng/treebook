import { Request, Response } from 'express';
import { SearchService } from '../services/SearchService';
import { catchAsync } from '../utils/catchAsync';

export const searchAll = catchAsync(async (req: Request, res: Response) => {
  const { q, type, limit, offset } = req.query;
  const query = typeof q === 'string' ? q : '';
  const filterType = typeof type === 'string' ? type : null;
  const limitNum = parseInt(String(limit)) || 20;
  const offsetNum = parseInt(String(offset)) || 0;

  const result = await SearchService.searchAll(query, filterType, limitNum, offsetNum);
  res.json({ success: true, data: result });
});
