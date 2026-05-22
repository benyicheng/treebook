import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createEditorialChangeRequest, listEditorialChangesRequest, getEditorialChangeRequest, applyEditorialChangeRequest } from '../utils/validation';
import { listEditorialChanges, getEditorialChangeById, createEditorialChange, applyEditorialChange } from '../controllers/editorialController';

const router = Router();

router.get('/changes', authenticate, requirePermission('editorial:view'), validateRequest(listEditorialChangesRequest), listEditorialChanges);
router.post('/changes', authenticate, requirePermission('editorial:propose'), validateRequest(createEditorialChangeRequest), createEditorialChange);
router.get('/changes/:id', authenticate, requirePermission('editorial:view'), validateRequest(getEditorialChangeRequest), getEditorialChangeById);
router.post('/changes/:id/apply', authenticate, requirePermission('editorial:apply'), validateRequest(applyEditorialChangeRequest), applyEditorialChange);

export default router;
