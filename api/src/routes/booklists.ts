import { Router } from 'express';
import { 
  createBooklist, 
  getBooklists, 
  getMyBooklists,
  getBooklistById, 
  updateBooklist, 
  deleteBooklist,
  addItemToBooklist,
  removeItemFromBooklist,
} from '../controllers/booklistController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getBooklists);
router.get('/my', authenticate, getMyBooklists);
router.get('/:id', getBooklistById);
router.post('/', authenticate, createBooklist);
router.put('/:id', authenticate, updateBooklist);
router.delete('/:id', authenticate, deleteBooklist);

router.post('/:id/items', authenticate, addItemToBooklist);
router.delete('/:id/items/:itemId', authenticate, removeItemFromBooklist);

export default router;
