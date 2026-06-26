import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { prisma, ensureFts5Table } from './prisma';
import { Prisma } from '@prisma/client';
import { createSocketIOServer } from './socket';
import { serializeBigInt } from './utils/bigint';

// Apply BigInt JSON serialization polyfill safely (only once)
serializeBigInt();

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
import storyEventRoutes from './routes/events';
import cookieParser from 'cookie-parser';
import { trace } from './middleware/trace';
import { encodingCheck } from './middleware/encodingCheck';
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

// 初始化 Socket.IO（提取到 socket.ts 模块）
const io = createSocketIOServer(server, corsOriginCallback);

const PORT = process.env.PORT || 3001;

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

app.use(cookieParser());
// 限制请求体大小，防止超大 JSON/form 造成内存压力（DoS 缓解）。
// 文件上传走 /api/media/uploads（multer 自带 50MB 限制），不受此处影响。
app.use(express.json({ limit: '2mb' }));

// Encoding check: reject body strings containing U+FFFD (�)
// Guards against Git Bash curl mangling Chinese characters (codepage conversion loss)
app.use(encodingCheck);

// SPA 不需要复杂嵌套对象解析，关闭 extended 避免 qs 的原型污染面
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

// NOTE: /uploads 静态路由已移除（安全审计 P2-12）。
// 原 /uploads/* 无需认证即可访问任何上传文件，绕过了 mediaController 的审批/鉴权逻辑。
// 所有媒体访问统一走 /api/media/assets/:id（optionalAuthenticate + 审批状态检查）。
// 若需迁移旧 StorageService 产生的 /uploads/ URL，参见 MediaStorageService.readAbsolute()。
// 如确需开放无需认证的公共资源目录，应单独设 /public 路径且仅放非敏感文件。

// 静态文件服务：提供前端编译后的资源
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// Global rate limiter: 100 requests per minute per IP (generous in dev for hot-reload)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 100 : 500,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please slow down' } },
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
      traceId: req.traceId,
    });
  });
  next();
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
app.use('/api/events', storyEventRoutes);

// Health check — 执行真实查询验证数据库可用
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw(Prisma.raw('SELECT 1 as alive'));
    res.json({ status: 'ok', database: 'connected' });
  } catch (_error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// 404 handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'API Route not found' } });
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

// Initialize FTS5 search index (non-blocking, will use LIKE fallback if fails)
ensureFts5Table().catch((err) => {
  logger.warn('[FTS5] Initialization failed, search will use LIKE fallback', { error: err?.message });
});

// Start server
server.listen(PORT, () => {
  logger.info(`Server running`, { port: PORT, env: process.env.NODE_ENV || 'development' });
});

export { prisma, io };
