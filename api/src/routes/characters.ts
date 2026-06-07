import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getCharacterAppearances,
  createCharacterAppearance,
  deleteCharacterAppearance,
} from '../controllers/characterController';

const router = Router();

// GET /api/characters/:charId/appearances — 查看角色在所有内容中的出场
router.get('/:charId/appearances', getCharacterAppearances);

// POST /api/characters/:charId/appearances — 创建出场记录
router.post('/:charId/appearances', authenticate, createCharacterAppearance);

// DELETE /api/characters/:charId/appearances/:id — 删除出场记录
router.delete('/:charId/appearances/:id', authenticate, deleteCharacterAppearance);

export default router;
