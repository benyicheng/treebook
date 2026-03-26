import { Router } from 'express';
import { createBranch, getBranches, getBranchById, updateBranch, deleteBranch, getMyBranches } from '../controllers/branchController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getBranches);
router.get('/my', authenticate, getMyBranches);
router.get('/:id', getBranchById);
router.post('/', authenticate, createBranch);
router.put('/:id', authenticate, updateBranch);
router.delete('/:id', authenticate, deleteBranch);

export default router;
