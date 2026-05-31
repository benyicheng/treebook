import express from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
  batchFollowStatus,
  getFollowActivity,
} from '../controllers/followController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/activity', authenticate, getFollowActivity);
router.get('/:userId/followers', authenticate, getFollowers);
router.get('/:userId/following', authenticate, getFollowing);
router.post('/follow', authenticate, followUser);
router.post('/unfollow', authenticate, unfollowUser);
router.get('/status', authenticate, checkFollowStatus);
router.post('/batch-status', authenticate, batchFollowStatus);

export default router;
