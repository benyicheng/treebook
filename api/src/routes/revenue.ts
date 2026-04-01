import express from 'express';
import { getWalletInfo, settleStoryRevenue, settleSpinoffRevenue } from '../controllers/revenueController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/wallet', authenticate, getWalletInfo);
router.post('/settle/:storyId', authenticate, settleStoryRevenue);
router.post('/settle/spinoff/:spinoffId', authenticate, settleSpinoffRevenue);

export default router;
