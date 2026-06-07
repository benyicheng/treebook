import express from 'express';
import { getForYou } from '../controllers/recommendationController';
import { optionalAuthenticate } from '../middleware/auth';

const router = express.Router();

router.get('/for-you', optionalAuthenticate, getForYou);

export default router;
