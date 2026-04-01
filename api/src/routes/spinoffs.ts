import { Router } from 'express';
import { createSpinoff, getAllSpinoffs, getSpinoffById, getMySpinoffs, updateSpinoff, deleteSpinoff } from '../controllers/spinoffController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getAllSpinoffs);
router.get('/my', authenticate, getMySpinoffs);
router.get('/:id', getSpinoffById);
router.post('/', authenticate, createSpinoff);
router.put('/:id', authenticate, updateSpinoff);
router.delete('/:id', authenticate, deleteSpinoff);

export default router;
