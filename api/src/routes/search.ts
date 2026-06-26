import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { searchAll } from '../controllers/searchController';

const router = Router();

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'TOO_MANY_REQUESTS', message: '搜索请求过于频繁' },
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(searchLimiter);

router.get('/', searchAll);

export default router;
