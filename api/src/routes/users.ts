import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { getUsers, assignRole, removeRole } from '../controllers/userController';

const router = Router();

router.get('/', authenticate, getUsers);
router.post('/:userId/roles', authenticate, requirePermission('user:role:assign'), assignRole);
router.delete('/:userId/roles/:roleId', authenticate, requirePermission('user:role:assign'), removeRole);

export default router;
