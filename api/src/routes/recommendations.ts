import express from 'express';
import { getForYou } from '../controllers/recommendationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/for-you', authenticate, getForYou);

export default router;
