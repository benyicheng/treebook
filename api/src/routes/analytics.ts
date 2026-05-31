import { Router } from 'express';
import { recordEvents } from '../controllers/analyticsController';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

// 批量上报埋点事件（可选认证，未登录用户也记录）
router.post('/events', optionalAuthenticate, recordEvents);

export default router;
