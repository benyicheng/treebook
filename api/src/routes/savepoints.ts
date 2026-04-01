import express from 'express';
import { authenticate } from '../middleware/auth';
import { 
  createSavepoint, 
  getUserSavepoints, 
  deleteSavepoint 
} from '../controllers/savepointController';

const router = express.Router();

// 所有存档操作都需要登录
router.use(authenticate);

router.post('/', createSavepoint);
router.get('/', getUserSavepoints);
router.delete('/:id', deleteSavepoint);

export default router;
