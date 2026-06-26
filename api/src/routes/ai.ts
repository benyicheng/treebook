import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { generateImage, generateVideo } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();

// AI 生成是资源密集型操作，限制每分钟 5 次
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'TOO_MANY_REQUESTS', message: 'AI 生成请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);
router.use(aiLimiter);

/**
 * @route   POST /api/ai/image
 * @desc    Generate image from text prompt
 */
router.post('/image', generateImage);

/**
 * @route   POST /api/ai/video
 * @desc    Generate video from text prompt
 */
router.post('/video', generateVideo);

export default router;
