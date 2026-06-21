import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import {
  createEvent,
  listEvents,
  getEventsByStory,
  getEventById,
  updateEvent,
  deleteEvent,
  addNode,
  removeNode,
  reorderNodes,
} from '../controllers/storyEventController';
import { getEventConnectors, getBranchComparison } from '../controllers/eventConnectorController';

const router = Router();

router.get('/', listEvents);
router.get('/story/:storyId', getEventsByStory);
// 事件卡六向连接器（必须在 /:id 之前注册，否则会被 /:id 吞掉）
// optionalAuthenticate：有 user 时供 flag 灰度分桶，无 user 也可访问
router.get('/connectors', optionalAuthenticate, getEventConnectors);
// Phase 4：分支对比（同样必须在 /:id 之前，否则 /:id 会吞掉 /:eventId/branches/compare）
router.get('/:eventId/branches/compare', optionalAuthenticate, getBranchComparison);
router.get('/:id', getEventById);

router.use(authenticate);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.post('/:eventId/nodes', addNode);
router.delete('/:eventId/nodes/:nodeId', removeNode);
router.put('/:eventId/nodes/reorder', reorderNodes);

export default router;
