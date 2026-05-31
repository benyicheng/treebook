import { Router } from 'express';
import { 
  createBranch, 
  getBranches, 
  getBranchById, 
  updateBranch, 
  deleteBranch, 
  getMyBranches 
} from '../controllers/branchController';
import { certifyBranch } from '../controllers/storyController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { 
  createBranchRequest, 
  updateBranchRequest 
} from '../utils/validation';

const router = Router();

router.get('/', getBranches);
router.get('/my', authenticate, getMyBranches);
router.get('/:id', getBranchById);

router.post('/', 
  authenticate,
  validateRequest(createBranchRequest), 
  createBranch
);

router.put('/:id', 
  authenticate,
  validateRequest(updateBranchRequest), 
  updateBranch
);

router.delete('/:id', authenticate, deleteBranch);
router.post('/:branchId/certify', authenticate, certifyBranch);

export default router;
