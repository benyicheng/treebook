import { Router } from 'express';
import { 
  getAllStories, 
  getStoryById, 
  createStory, 
  updateStory, 
  deleteStory, 
  getMyStories, 
  getRecentReads,
  getStoryCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getTags
} from '../controllers/storyController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getAllStories);
router.get('/tags', getTags);
router.get('/my', authenticate, getMyStories);
router.get('/recent', authenticate, getRecentReads);
router.get('/:id', getStoryById);
router.post('/', authenticate, createStory);
router.put('/:id', authenticate, updateStory);
router.delete('/:id', authenticate, deleteStory);

// Character routes
router.get('/:id/characters', getStoryCharacters);
router.post('/:id/characters', authenticate, createCharacter);
router.put('/characters/:charId', authenticate, updateCharacter);
router.delete('/characters/:charId', authenticate, deleteCharacter);

export default router;
