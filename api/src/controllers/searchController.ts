import { Request, Response } from 'express';
import { SearchService } from '../services/SearchService';

export const searchAll = async (req: Request, res: Response) => {
  try {
    const { q, type, limit, offset } = req.query;
    const query = typeof q === 'string' ? q : '';
    const filterType = typeof type === 'string' ? type : null;
    const limitNum = parseInt(String(limit)) || 20;
    const offsetNum = parseInt(String(offset)) || 0;

    const result = await SearchService.searchAll(query, filterType, limitNum, offsetNum);

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Search error:', error?.message);
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_FAILED', message: '搜索服务暂时不可用' },
    });
  }
};
