import { Router } from 'express';
import { createChapter, updateChapter, deleteChapter, getChapterById, getComments, createComment } from '../controllers/chapterController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:id', getChapterById);
router.get('/:id/comments', getComments);
router.post('/', authenticate, createChapter);
router.post('/:id/comments', authenticate, createComment);
router.put('/:id', authenticate, updateChapter);
router.delete('/:id', authenticate, deleteChapter);

export default router;
