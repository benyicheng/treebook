import { Router } from 'express';
import { 
  createChapter, 
  updateChapter, 
  deleteChapter, 
  getChapterById, 
  getChaptersByStory,
  searchChapters,
  getComments, 
  createComment,
  updateComment 
} from '../controllers/chapterController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { 
  createChapterRequest, 
  updateChapterRequest, 
  createCommentRequest,
  updateCommentRequest 
} from '../utils/validation';

const router = Router();

router.get('/search', searchChapters);
router.get('/stories/:storyId', getChaptersByStory);
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

router.put('/comments/:commentId',
  authenticate,
  validateRequest(updateCommentRequest),
  updateComment
);

router.put('/:id', 
  authenticate, 
  validateRequest(updateChapterRequest), 
  updateChapter
);

router.delete('/:id', authenticate, deleteChapter);

export default router;
