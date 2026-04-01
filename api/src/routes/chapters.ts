import { Router } from 'express';
import { 
  createChapter, 
  updateChapter, 
  deleteChapter, 
  getChapterById, 
  getComments, 
  createComment 
} from '../controllers/chapterController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { 
  createChapterRequest, 
  updateChapterRequest, 
  createCommentRequest 
} from '../utils/validation';

const router = Router();

router.get('/:id', getChapterById);
router.get('/:id/comments', getComments);

router.post('/', 
  authenticate, 
  validateRequest(createChapterRequest), 
  createChapter
);

router.post('/:id/comments', 
  authenticate, 
  validateRequest(createCommentRequest), 
  createComment
);

router.put('/:id', 
  authenticate, 
  validateRequest(updateChapterRequest), 
  updateChapter
);

router.delete('/:id', authenticate, deleteChapter);

export default router;
