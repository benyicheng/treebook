import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { JWT_SECRET } from './config/jwt';
import authRoutes from './routes/auth';
import storyRoutes from './routes/stories';
import chapterRoutes from './routes/chapters';
import branchRoutes from './routes/branches';
import booklistRoutes from './routes/booklists';
import spinoffRoutes from './routes/spinoffs';
import roleRoutes from './routes/roles';
import interactionRoutes from './routes/interactions';
import cmsRoutes from './routes/cms';
import savepointRoutes from './routes/savepoints';
import revenueRoutes from './routes/revenue';
import discoverRoutes from './routes/discover';
import feedbackRoutes from './routes/feedback';
import readingPathRoutes from './routes/readingPaths';
import mergeRoutes from './routes/merges';
import followRoutes from './routes/follows';
import activityRoutes from './routes/activities';
import aiRoutes from './routes/ai';
import wikiRoutes from './routes/wiki';
import initRoutes from './routes/initRoutes';
import moderationRoutes from './routes/moderation';
import reviewWorkflowRoutes from './routes/reviewWorkflow';
import mediaRoutes from './routes/media';
import editorialRoutes from './routes/editorial';
import searchRoutes from './routes/search';
import notificationRoutes from './routes/notifications';
import analyticsRoutes from './routes/analytics';
import recommendationRoutes from './routes/recommendations';
import userRoutes from './routes/users';
import characterRoutes from './routes/characters';
import readingProgressRoutes from './routes/readingProgress';
import { trace } from './middleware/trace';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// 创建 Express 应用
const app = express();

// 创建 HTTP 服务器
const server = http.createServer(app);

// CORS 白名单：从 CORS_ORIGINS 环境变量读取（逗号分隔），开发环境自动包含 localhost
const corsOrigins = (() => {
  const raw = process.env.CORS_ORIGINS || '';
  const origins = raw.split(',').map(s => s.trim()).filter(Boolean);
  
  if (process.env.NODE_ENV === 'production') {
    if (origins.length === 0) {
      logger.warn('[CORS] CORS_ORIGINS not set in production environment. All cross-origin requests will be blocked.');
    }
  } else {
    // 开发环境自动包含 common Vite dev server origins
    const devOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
    for (const origin of devOrigins) {
      if (!origins.includes(origin)) {
        origins.push(origin);
      }
    }
  }
  return origins;
})();

// CORS 验证函数：检查请求来源是否在白名单中
const corsOriginCallback: cors.CorsOptions['origin'] = (origin, callback) => {
  // 允许无 origin 的请求（如 Postman、curl、同源请求）
  if (!origin) return callback(null, true);
  if (corsOrigins.includes(origin)) {
    return callback(null, true);
  }
  logger.warn('[CORS] Blocked origin', { origin });
  callback(new Error(`Origin ${origin} not allowed by CORS`));
};

// 初始化 Socket.IO
const io = new Server(server, {
  cors: {
    origin: corsOriginCallback,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// 协作编辑锁管理 (Collaboration Locks)
// chapterId -> { userId, username, socketId }
const editLocks = new Map<string, { userId: string, username: string, socketId: string }>();

// Helmet CSP configuration (environment-aware)
const isProduction = process.env.NODE_ENV === 'production';

const helmetConfig = isProduction
  ? {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: "same-origin" as const },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      noSniff: true,
      frameguard: { action: "deny" as const },
      xssFilter: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" as const },
    }
  : {
      // Development: relax CSP for Vite HMR and localhost dev server
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws://localhost:5173", "http://localhost:5173", "http://localhost:3001"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" as const }, // OK for dev (Vite proxy)
      hsts: false, // Disable HSTS in dev
      noSniff: true,
      frameguard: { action: "deny" as const },
      xssFilter: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" as const },
    };

app.use(trace);
app.use(helmet(helmetConfig));

// CORS Configuration (Express)
app.use(cors({
  origin: corsOriginCallback,
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// 静态文件服务：提供上传的多媒体文件访问
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 静态文件服务：提供前端编译后的资源
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// Global rate limiter: 100 requests per minute per IP (generous in dev for hot-reload)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 100 : 500,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
      traceId: (req as any).traceId,
    });
  });
  next();
});

// Socket.IO JWT 认证中间件
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Socket authentication required'));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    socket.data.user = decoded;
    next();
  } catch (err) {
    const e = err as Error;
    console.error('[Socket Auth] JWT verify failed:', e.message, e.name);
    next(new Error('Invalid socket token'));
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  logger.debug('Socket connected', { socketId: socket.id, userId: socket.data.user?.id });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    logger.debug('Socket joined room', { socketId: socket.id, roomId });
    
    // 发送当前该房间的所有锁状态
    const roomLocks: any = {};
    editLocks.forEach((lock, chapterId) => {
      roomLocks[chapterId] = { userId: lock.userId, username: lock.username };
    });
    socket.emit('locks-update', roomLocks);
  });

  // 请求编辑锁
  socket.on('request-lock', (data: { chapterId: string, roomId: string }) => {
    const userId = socket.data.user.id;
    const username = socket.data.user.email;
    const existingLock = editLocks.get(data.chapterId);
    
    if (!existingLock || existingLock.userId === userId) {
      // 获得锁或已经是持锁者
      editLocks.set(data.chapterId, { 
        userId, 
        username, 
        socketId: socket.id 
      });
      
      // 广播给房间内所有人
      io.to(data.roomId).emit('lock-acquired', {
        chapterId: data.chapterId,
        userId,
        username
      });
    } else {
      // 锁已被占用
      socket.emit('lock-denied', {
        chapterId: data.chapterId,
        lockedBy: existingLock.username
      });
    }
  });

  // 释放编辑锁
  socket.on('release-lock', (data: { chapterId: string, roomId: string }) => {
    const lock = editLocks.get(data.chapterId);
    if (lock && lock.socketId === socket.id) {
      editLocks.delete(data.chapterId);
      io.to(data.roomId).emit('lock-released', { chapterId: data.chapterId });
    }
  });

  socket.on('content-change', (data) => {
    // Broadcast to all clients in the room except sender
    socket.to(data.roomId).emit('content-update', data);
  });

  socket.on('disconnect', () => {
    logger.debug('Socket disconnected', { socketId: socket.id });
    
    // 自动释放该用户持有的所有锁
    editLocks.forEach((lock, chapterId) => {
      if (lock.socketId === socket.id) {
        editLocks.delete(chapterId);
        // 由于断开连接时可能不知道 roomId，可以全局广播或按需处理
        io.emit('lock-released', { chapterId });
      }
    });
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/booklists', booklistRoutes);
app.use('/api/spinoffs', spinoffRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/savepoints', savepointRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reading-paths', readingPathRoutes);
app.use('/api/merges', mergeRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/review-workflow', reviewWorkflowRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/editorial', editorialRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/wiki-pages', wikiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/reading-progress', readingProgressRoutes);
app.use('/api/init', initRoutes);

// Health check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$connect();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// 404 handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'API Route not found' });
});

// Error handling middleware (必须在 SPA fallback 之前注册)
app.use(errorHandler);

// SPA Fallback: 非 API 请求全部重定向到 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`Server running`, { port: PORT, env: process.env.NODE_ENV || 'development' });
});

export { prisma, io };
