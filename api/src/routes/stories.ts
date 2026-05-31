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
  certifyBranch,
  batchCharacterAppearances,
  getStoryCharacterAppearances
} from '../controllers/storyController';
import { getUniverseMap } from '../controllers/mapController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { 
  createStoryRequest, 
  updateStoryRequest, 
  createCharacterRequest, 
  updateCharacterRequest,
  batchCharacterAppearancesRequest
} from '../utils/validation';

const router = Router();

router.get('/', getAllStories);
router.get('/tags', getTags);
router.get('/my', authenticate, getMyStories);
router.get('/recent', authenticate, getRecentReads);
router.get('/:id', getStoryById);
router.get('/:id/map', getUniverseMap);

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

// Character appearance routes
router.get('/:id/character-appearances', getStoryCharacterAppearances);

router.put('/:id/character-appearances',
  authenticate,
  validateRequest(batchCharacterAppearancesRequest),
  batchCharacterAppearances
);

// Branch routes
router.post('/branches/:branchId/certify', authenticate, certifyBranch);

export default router;
