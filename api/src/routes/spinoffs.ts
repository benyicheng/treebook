import { Router } from 'express';
import { createSpinoff, getAllSpinoffs, getSpinoffById, getMySpinoffs } from '../controllers/spinoffController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getAllSpinoffs);
router.get('/my', authenticate, getMySpinoffs);
router.get('/:id', getSpinoffById);
router.post('/', authenticate, createSpinoff);

export default router;
