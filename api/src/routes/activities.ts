import express from 'express';
import { getFeed, getUserActivities } from '../controllers/activityController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/feed', authenticate, getFeed);
router.get('/user/:userId', authenticate, getUserActivities);

export default router;
