import { Router } from 'express';
import { generateImage, generateVideo } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();

// AI 功能统一需要认证，防止资源滥用
router.use(authenticate);

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
