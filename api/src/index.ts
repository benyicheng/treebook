import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import storyRoutes from './routes/stories';
import chapterRoutes from './routes/chapters';
import branchRoutes from './routes/branches';
import booklistRoutes from './routes/booklists';
import spinoffRoutes from './routes/spinoffs';
import roleRoutes from './routes/roles';
import interactionRoutes from './routes/interactions';
import cmsRoutes from './routes/cms';

dotenv.config();

// 初始化 Prisma 客户端
const prisma = new PrismaClient();

// 创建 Express 应用
const app = express();

// 创建 HTTP 服务器
const server = http.createServer(app);

// 初始化 Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for easier local development
}));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

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
  });

  socket.on('content-change', (data) => {
    // Broadcast to all clients in the room except sender
    socket.to(data.roomId).emit('content-update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
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

// Health check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$connect();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

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
