import path from 'path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import { prisma } from './prisma';
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
import mergeRoutes from './routes/merges';
import aiRoutes from './routes/ai';
import initRoutes from './routes/initRoutes';
import moderationRoutes from './routes/moderation';
import reviewWorkflowRoutes from './routes/reviewWorkflow';
import mediaRoutes from './routes/media';
import editorialRoutes from './routes/editorial';
import { trace } from './middleware/trace';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

// 创建 Express 应用
const app = express();

// 创建 HTTP 服务器
const server = http.createServer(app);

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://43.135.162.210' // The server IP
];

// 初始化 Socket.IO
const io = new Server(server, {
  cors: {
    origin: true, // 动态反射，允许所有来源并自动回传 Origin 头部
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// 协作编辑锁管理 (Collaboration Locks)
// chapterId -> { userId, username, socketId }
const editLocks = new Map<string, { userId: string, username: string, socketId: string }>();

// Middleware
app.use(trace);
app.use(helmet({
  contentSecurityPolicy: false, // Disable for easier local development
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration (Express)
app.use(cors({
  origin: true, // 动态反射，这是解决生产环境跨域最稳妥的方法
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
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    
    // 发送当前该房间的所有锁状态
    const roomLocks: any = {};
    editLocks.forEach((lock, chapterId) => {
      roomLocks[chapterId] = { userId: lock.userId, username: lock.username };
    });
    socket.emit('locks-update', roomLocks);
  });

  // 请求编辑锁
  socket.on('request-lock', (data: { chapterId: string, userId: string, username: string, roomId: string }) => {
    const existingLock = editLocks.get(data.chapterId);
    
    if (!existingLock || existingLock.userId === data.userId) {
      // 获得锁或已经是持锁者
      editLocks.set(data.chapterId, { 
        userId: data.userId, 
        username: data.username, 
        socketId: socket.id 
      });
      
      // 广播给房间内所有人
      io.to(data.roomId).emit('lock-acquired', {
        chapterId: data.chapterId,
        userId: data.userId,
        username: data.username
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
    console.log('User disconnected:', socket.id);
    
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
app.use('/api/merges', mergeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/review-workflow', reviewWorkflowRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/editorial', editorialRoutes);
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

// SPA Fallback: 非 API 请求全部重定向到 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { prisma, io };
