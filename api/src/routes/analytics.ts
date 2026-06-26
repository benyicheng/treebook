import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { recordEvents } from '../controllers/analyticsController';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'TOO_MANY_REQUESTS', message: '事件上报过于频繁' },
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(analyticsLimiter);

// 批量上报埋点事件（可选认证，未登录用户也记录）
router.post('/events', optionalAuthenticate, recordEvents);

export default router;
