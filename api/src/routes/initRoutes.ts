import { Router } from 'express';
import { InitController } from '../controllers/initController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/check', InitController.check);
router.post('/setup', InitController.setup);
router.post('/bootstrap-rbac', authenticate, InitController.bootstrapRbac);

export default router;
