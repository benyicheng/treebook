import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getReadingProgress,
  getReadingStats,
  upsertReadingProgress,
} from '../controllers/readingProgressController';

const router = express.Router();

// 所有阅读进度操作都需要登录
router.use(authenticate);

router.get('/', getReadingProgress);
router.get('/stats', getReadingStats);
router.put('/:chapterId', upsertReadingProgress);

export default router;
