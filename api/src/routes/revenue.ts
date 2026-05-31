import express from 'express';
import { getWalletInfo, settleStoryRevenue, settleSpinoffRevenue } from '../controllers/revenueController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = express.Router();

router.get('/wallet', authenticate, getWalletInfo);
router.post('/settle/:storyId', authenticate, requirePermission('system:settings'), settleStoryRevenue);
router.post('/settle/spinoff/:spinoffId', authenticate, requirePermission('system:settings'), settleSpinoffRevenue);

export default router;
