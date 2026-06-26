import { Router } from 'express';
import { 
  getInteractionStats, 
  getRatingReasonTags,
  toggleLike, 
  updateRating, 
  recordShare 
} from '../controllers/interactionController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { 
  getInteractionStatsRequest,
  toggleLikeRequest,
  updateRatingRequest,
  recordShareRequest
} from '../utils/validation';

const router = Router();

router.get('/rating-reason-tags', getRatingReasonTags);

router.get('/:targetType/:targetId', optionalAuthenticate, validateRequest(getInteractionStatsRequest), getInteractionStats);
router.post('/:targetType/:targetId/like', authenticate, validateRequest(toggleLikeRequest), toggleLike);
router.put('/:targetType/:targetId/rating', authenticate, validateRequest(updateRatingRequest), updateRating);
router.post('/:targetType/:targetId/share', authenticate, validateRequest(recordShareRequest), recordShare);

export default router;
