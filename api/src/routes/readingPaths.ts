import { Router } from 'express';
import {
  getReadingPaths,
  getAllReadingPaths,
  getReadingPathById,
  createReadingPath,
  updateReadingPath,
  recordPathView,
  startReading,
  getTrail,
  advanceTrail,
  getPathCharacters,
} from '../controllers/readingPathController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Universe-scoped: GET /api/reading-paths/universes/:id
router.get('/universes/:id', getReadingPaths);

// Global list: GET /api/reading-paths?sortBy=hot|new&limit=20
router.get('/', getAllReadingPaths);

// Path CRUD (routes are mounted at /api/reading-paths)
router.get('/:id', getReadingPathById);
router.get('/:id/characters', getPathCharacters);
router.post('/', authenticate, createReadingPath);
router.put('/:id', authenticate, updateReadingPath);
router.post('/:id/view', recordPathView);

// Trail — 阅读进度追踪
router.post('/:id/start', authenticate, startReading);
router.get('/trails/:trailId', authenticate, getTrail);
router.post('/trails/:trailId/advance', authenticate, advanceTrail);

export default router;
