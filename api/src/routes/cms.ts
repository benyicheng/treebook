import { Router } from 'express';
import * as cmsController from '../controllers/cmsController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// 公开接口：获取所有站点配置
router.get('/', cmsController.getSiteConfig);

// 公开接口：获取站点统计
router.get('/stats', cmsController.getStats);

// 管理员接口：批量更新配置
router.put('/', authenticate, requirePermission('cms:manage'), cmsController.updateSiteConfig);

export default router;

