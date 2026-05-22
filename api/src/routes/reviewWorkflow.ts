import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { listReviewCasesRequest, getReviewCaseRequest, addReviewCaseActionRequest } from '../utils/validation';
import { listReviewCases, getReviewCaseById, addReviewCaseAction } from '../controllers/reviewWorkflowController';

const router = Router();

router.get('/cases', authenticate, requirePermission('review:case:view'), validateRequest(listReviewCasesRequest), listReviewCases);
router.get('/cases/:id', authenticate, requirePermission('review:case:view'), validateRequest(getReviewCaseRequest), getReviewCaseById);
router.post('/cases/:id/actions', authenticate, requirePermission('review:case:act'), validateRequest(addReviewCaseActionRequest), addReviewCaseAction);

export default router;
