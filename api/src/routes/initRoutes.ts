import { Router } from 'express';
import { InitController } from '../controllers/InitController';

const router = Router();

router.get('/check', InitController.check);
router.post('/setup', InitController.setup);

export default router;
