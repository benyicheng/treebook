import { Router } from 'express';
import { 
  getInteractionStats, 
  toggleLike, 
  updateRating, 
  recordShare 
} from '../controllers/interactionController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.get('/:targetType/:targetId', optionalAuthenticate, getInteractionStats);
router.post('/:targetType/:targetId/like', authenticate, toggleLike);
router.put('/:targetType/:targetId/rating', authenticate, updateRating);
router.post('/:targetType/:targetId/share', recordShare);

export default router;
