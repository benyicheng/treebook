import { Router } from 'express';
import { getUniverseFeed } from '../controllers/discoverController';

const router = Router();

router.get('/universes', getUniverseFeed);

export default router;
