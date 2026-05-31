import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController';

const router = Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.post('/:id/read', authenticate, markAsRead);
router.post('/read-all', authenticate, markAllAsRead);

export default router;
