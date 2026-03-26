import { Router } from 'express';
import { 
  createBooklist, 
  getBooklists, 
  getBooklistById, 
  updateBooklist, 
  deleteBooklist,
  getMyBooklists, 
  addChapterToBooklist,
  updateBooklistItem,
  removeBooklistItem
} from '../controllers/booklistController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getBooklists);
router.get('/my', authenticate, getMyBooklists);
router.get('/:id', getBooklistById);
router.post('/', authenticate, createBooklist);
router.put('/:id', authenticate, updateBooklist);
router.delete('/:id', authenticate, deleteBooklist);
router.post('/:id/items', authenticate, addChapterToBooklist);
router.put('/:id/items/:itemId', authenticate, updateBooklistItem);
router.delete('/:id/items/:itemId', authenticate, removeBooklistItem);

export default router;
