import express from 'express';
import { createMergeRequest, getMergeRequests, handleMergeRequest } from '../controllers/mergeController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/:storyId', authenticate, getMergeRequests);
router.post('/create', authenticate, createMergeRequest);
router.post('/handle/:requestId', authenticate, handleMergeRequest);

export default router;
