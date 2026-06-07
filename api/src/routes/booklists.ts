import { Router } from 'express';
import { 
  createBooklist, 
  getBooklists, 
  getMyBooklists,
  getBooklistById, 
  updateBooklist, 
  deleteBooklist,
  addItemToBooklist,
  updateBooklistItemNotes,
  removeItemFromBooklist,
  upsertProgress,
  toggleProgress,
  getProgress,
  createRelation,
  deleteRelation,
  getGraph,
  syncStoryLinks,
  getStoryLinks,
} from '../controllers/booklistController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  updateBooklistItemNotesRequest,
  createBooklistRelationRequest,
  deleteBooklistRelationRequest,
  getBooklistGraphRequest,
} from '../utils/validation';

const router = Router();

router.get('/', getBooklists);
router.get('/my', authenticate, getMyBooklists);
router.get('/:id', getBooklistById);
router.post('/', authenticate, createBooklist);
router.put('/:id', authenticate, updateBooklist);
router.delete('/:id', authenticate, deleteBooklist);

router.post('/:id/items', authenticate, addItemToBooklist);
router.put('/:id/items/:itemId', authenticate, validateRequest(updateBooklistItemNotesRequest), updateBooklistItemNotes);
router.delete('/:id/items/:itemId', authenticate, removeItemFromBooklist);

router.get('/:id/progress', authenticate, getProgress);
router.patch('/:id/progress', authenticate, upsertProgress);
router.post('/:id/progress/toggle', authenticate, toggleProgress);

// Graph: Relations
router.get('/:id/graph', validateRequest(getBooklistGraphRequest), getGraph);
router.post('/:id/relations', authenticate, validateRequest(createBooklistRelationRequest), createRelation);
router.delete('/:id/relations/:relationId', authenticate, validateRequest(deleteBooklistRelationRequest), deleteRelation);

// Graph: Story Links
router.get('/:id/story-links', getStoryLinks);
router.post('/:id/sync-story-links', authenticate, syncStoryLinks);

export default router;
