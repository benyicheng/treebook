import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, getPublicProfile, updateMe, refresh, logout } from '../controllers/authController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

// Rate limiter for auth endpoints: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Lighter limiter for refresh token cycling (no password involved)
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.get('/profile/:userId', optionalAuthenticate, getPublicProfile);

export default router;
