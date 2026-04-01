import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { 
  createRoleRequest, 
  updateRoleRequest, 
  updateRolePermissionsRequest, 
  bulkDeleteRolesRequest 
} from '../utils/validation';
import { 
  listRoles, 
  createRole, 
  getRoleById, 
  updateRole, 
  updateRolePermissions, 
  listPermissions, 
  deleteRole, 
  bulkDeleteRoles, 
  exportRolesCsv 
} from '../controllers/roleController';

const router = Router();

// 权限查询接口
router.get('/permissions', authenticate, listPermissions);

// 角色管理
router.get('/', authenticate, requirePermission('role:view'), listRoles);
router.post('/', authenticate, requirePermission('role:create'), validateRequest(createRoleRequest), createRole);
router.get('/export', authenticate, requirePermission('role:export'), exportRolesCsv);

router.get('/:id', authenticate, requirePermission('role:view'), getRoleById);
router.patch('/:id', authenticate, requirePermission('role:edit'), validateRequest(updateRoleRequest), updateRole);
router.delete('/:id', authenticate, requirePermission('role:delete'), deleteRole);

router.post('/:id/permissions', authenticate, requirePermission('role:edit'), validateRequest(updateRolePermissionsRequest), updateRolePermissions);
router.post('/bulk-delete', authenticate, requirePermission('role:delete'), validateRequest(bulkDeleteRolesRequest), bulkDeleteRoles);

export default router;
