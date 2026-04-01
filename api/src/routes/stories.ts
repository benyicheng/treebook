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
  getTags,
  certifyBranch
} from '../controllers/storyController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { 
  createStoryRequest, 
  updateStoryRequest, 
  createCharacterRequest, 
  updateCharacterRequest 
} from '../utils/validation';

const router = Router();

router.get('/', getAllStories);
router.get('/tags', getTags);
router.get('/my', authenticate, getMyStories);
router.get('/recent', authenticate, getRecentReads);
router.get('/:id', getStoryById);

router.post('/', 
  authenticate, 
  validateRequest(createStoryRequest), 
  createStory
);

router.put('/:id', 
  authenticate, 
  validateRequest(updateStoryRequest), 
  updateStory
);

router.delete('/:id', authenticate, deleteStory);

// Character routes
router.get('/:id/characters', getStoryCharacters);

router.post('/:id/characters', 
  authenticate, 
  validateRequest(createCharacterRequest), 
  createCharacter
);

router.put('/characters/:charId', 
  authenticate, 
  validateRequest(updateCharacterRequest), 
  updateCharacter
);

router.delete('/characters/:charId', authenticate, deleteCharacter);

// Branch routes
router.post('/branches/:branchId/certify', authenticate, certifyBranch);

export default router;
