import { Router } from 'express';
import * as cmsController from '../controllers/cmsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// 公开接口：获取所有站点配置
router.get('/', cmsController.getSiteConfig);

// 管理员接口：批量更新配置（需要登录，控制器内部再校验 admin 角色）
router.put('/', authenticate, cmsController.updateSiteConfig);

export default router;

