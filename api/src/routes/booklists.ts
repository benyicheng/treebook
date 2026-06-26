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
  batchAddItems,
  reorderBooklistItems,
  upsertProgress,
  toggleProgress,
  getProgress,
  createRelation,
  deleteRelation,
  getGraph,
  syncStoryLinks,
  getStoryLinks,
  getBooklistWikiPages,
} from '../controllers/booklistController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  updateBooklistItemNotesRequest,
  batchAddBooklistItemsRequest,
  reorderBooklistItemsRequest,
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
router.post('/:id/items/batch', authenticate, validateRequest(batchAddBooklistItemsRequest), batchAddItems);
router.put('/:id/items/reorder', authenticate, validateRequest(reorderBooklistItemsRequest), reorderBooklistItems);
router.put('/:id/items/:itemId', authenticate, validateRequest(updateBooklistItemNotesRequest), updateBooklistItemNotes);
router.delete('/:id/items/:itemId', authenticate, removeItemFromBooklist);

router.get('/:id/progress', authenticate, getProgress);
router.patch('/:id/progress', authenticate, upsertProgress);
router.post('/:id/progress/toggle', authenticate, toggleProgress);

// Graph: Relations
router.get('/:id/graph', validateRequest(getBooklistGraphRequest), getGraph);
router.post('/:id/relations', authenticate, validateRequest(createBooklistRelationRequest), createRelation);
router.delete('/:id/relations/:relationId', authenticate, validateRequest(deleteBooklistRelationRequest), deleteRelation);

// Wiki: Pages associated with this booklist
router.get('/:id/wiki-pages', getBooklistWikiPages);

// Graph: Story Links
router.get('/:id/story-links', getStoryLinks);
router.post('/:id/sync-story-links', authenticate, syncStoryLinks);

export default router;
