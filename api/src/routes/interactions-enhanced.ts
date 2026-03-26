import { Router } from 'express';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { sendErr, sendOk } from '../utils/http';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const router = Router();

type TargetType = 'story' | 'chapter' | 'booklist' | 'spinoff';

type OptionalAuthRequest = Request & { 
  user?: { id: string; role: string; permissions?: string[] }; 
  traceId?: string;
  clientInfo?: {
    ip: string;
    userAgent: string;
    fingerprint: string;
  };
};

// 增强的客户端信息提取
const extractClientInfo = (req: Request) => {
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() 
    || req.socket.remoteAddress 
    || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // 生成设备指纹 (简化版)
  const fingerprint = Buffer.from(`${ip}:${userAgent}`).toString('base64').slice(0, 16);
  
  return { ip, userAgent, fingerprint };
};

const optionalAuth = (req: OptionalAuthRequest, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  req.clientInfo = extractClientInfo(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
  } catch {}
  next();
};

const getTraceId = (req: any) => req.traceId as string | undefined;

const isTargetType = (t: string): t is TargetType => t === 'story' || t === 'chapter' || t === 'booklist' || t === 'spinoff';

const keyOf = (targetType: string, targetId: string) => `stats:${targetType}:${targetId}`;
const rateLimitKey = (prefix: string, identifier: string) => `ratelimit:${prefix}:${identifier}`;

// ==================== 内存缓存 (生产环境应使用Redis) ====================
interface CacheEntry {
  expiresAt: number;
  data: any;
  version: number;
}

const statsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30000; // 30秒
const CACHE_VERSION = 1;

const cacheGet = (k: string): any | null => {
  const v = statsCache.get(k);
  if (!v) return null;
  if (v.expiresAt <= Date.now() || v.version !== CACHE_VERSION) {
    statsCache.delete(k);
    return null;
  }
  return v.data;
};

const cacheSet = (k: string, data: any, ttlMs: number = CACHE_TTL_MS) => {
  statsCache.set(k, { 
    expiresAt: Date.now() + ttlMs, 
    data,
    version: CACHE_VERSION 
  });
};

const cacheDel = (k: string) => {
  statsCache.delete(k);
};

const cacheInvalidatePattern = (pattern: string) => {
  const regex = new RegExp(pattern.replace('*', '.*'));
  for (const key of statsCache.keys()) {
    if (regex.test(key)) {
      statsCache.delete(key);
    }
  }
};

// ==================== 增强限流系统 ====================
interface RateLimitBucket {
  count: number;
  resetAt: number;
  violations: number;
  blockedUntil?: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

// 限流配置
const RATE_LIMITS = {
  like: { limit: 30, windowMs: 60000, blockThreshold: 5, blockDurationMs: 300000 }, // 1分钟30次，违规5次封5分钟
  rating: { limit: 20, windowMs: 60000, blockThreshold: 3, blockDurationMs: 600000 }, // 1分钟20次，违规3次封10分钟
  share: { limit: 60, windowMs: 60000, blockThreshold: 10, blockDurationMs: 180000 }, // 1分钟60次
  stats: { limit: 100, windowMs: 60000, blockThreshold: 20, blockDurationMs: 300000 }, // 统计接口
};

type RateLimitType = keyof typeof RATE_LIMITS;

const checkRateLimit = (key: string, type: RateLimitType): { allowed: boolean; remaining: number; resetAt: number; blocked?: boolean } => {
  const config = RATE_LIMITS[type];
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  
  // 检查是否被封禁
  if (bucket?.blockedUntil && bucket.blockedUntil > now) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt: bucket.blockedUntil,
      blocked: true 
    };
  }
  
  // 重置过期的桶
  if (!bucket || bucket.resetAt <= now) {
    const newBucket: RateLimitBucket = { 
      count: 1, 
      resetAt: now + config.windowMs,
      violations: 0 
    };
    rateLimitBuckets.set(key, newBucket);
    return { 
      allowed: true, 
      remaining: config.limit - 1, 
      resetAt: newBucket.resetAt 
    };
  }
  
  // 检查限流
  if (bucket.count >= config.limit) {
    // 增加违规次数
    bucket.violations++;
    
    // 检查是否需要封禁
    if (bucket.violations >= config.blockThreshold) {
      bucket.blockedUntil = now + config.blockDurationMs;
      console.warn(`[RateLimit] User blocked: ${key}, type: ${type}, violations: ${bucket.violations}`);
      return { 
        allowed: false, 
        remaining: 0, 
        resetAt: bucket.blockedUntil,
        blocked: true 
      };
    }
    
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt: bucket.resetAt 
    };
  }
  
  bucket.count++;
  return { 
    allowed: true, 
    remaining: config.limit - bucket.count, 
    resetAt: bucket.resetAt 
  };
};

// ==================== 用户行为埋点 ====================
interface InteractionEvent {
  id: string;
  timestamp: number;
  userId?: string;
  fingerprint: string;
  ip: string;
  action: 'like' | 'unlike' | 'rate' | 'share' | 'view_stats';
  targetType: string;
  targetId: string;
  metadata?: Record<string, any>;
  duration?: number;
}

const eventBuffer: InteractionEvent[] = [];
const EVENT_BUFFER_SIZE = 100;
const EVENT_FLUSH_INTERVAL_MS = 5000;

// 异步批量写入事件
const flushEvents = async () => {
  if (eventBuffer.length === 0) return;
  
  const events = eventBuffer.splice(0, eventBuffer.length);
  
  // 生产环境: 发送到消息队列或写入数据库
  // 开发环境: 打印日志
  if (process.env.NODE_ENV === 'production') {
    try {
      // 批量插入事件表
      await prisma.$transaction(
        events.map(e => prisma.$executeRaw`
          INSERT INTO interaction_events (id, timestamp, user_id, fingerprint, ip, action, target_type, target_id, metadata)
          VALUES (${e.id}, ${new Date(e.timestamp)}, ${e.userId || null}, ${e.fingerprint}, ${e.ip}, ${e.action}, ${e.targetType}, ${e.targetId}, ${JSON.stringify(e.metadata || {})})
        `)
      );
    } catch (err) {
      console.error('[Analytics] Failed to flush events:', err);
    }
  } else {
    console.log('[Analytics]', JSON.stringify(events, null, 2));
  }
};

// 定时刷新
setInterval(flushEvents, EVENT_FLUSH_INTERVAL_MS);

const trackEvent = (req: OptionalAuthRequest, action: InteractionEvent['action'], targetType: string, targetId: string, metadata?: Record<string, any>, duration?: number) => {
  const event: InteractionEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    userId: req.user?.id,
    fingerprint: req.clientInfo?.fingerprint || 'unknown',
    ip: req.clientInfo?.ip || 'unknown',
    action,
    targetType,
    targetId,
    metadata,
    duration
  };
  
  eventBuffer.push(event);
  
  // 缓冲区满时立即刷新
  if (eventBuffer.length >= EVENT_BUFFER_SIZE) {
    flushEvents();
  }
};

// ==================== 目标存在性检查 ====================
const ensureTargetExists = async (targetType: TargetType, targetId: string): Promise<boolean> => {
  const checkers: Record<TargetType, () => Promise<boolean>> = {
    story: async () => !!(await prisma.story.findUnique({ where: { id: targetId }, select: { id: true } })),
    chapter: async () => !!(await prisma.chapter.findUnique({ where: { id: targetId }, select: { id: true } })),
    booklist: async () => !!(await prisma.booklist.findUnique({ where: { id: targetId }, select: { id: true } })),
    spinoff: async () => !!(await prisma.spinoff.findUnique({ where: { id: targetId }, select: { id: true } })),
  };
  return checkers[targetType]();
};

// ==================== 评分工具函数 ====================
const toValueInt = (score: any): number | null => {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  const valueInt = Math.round(n * 2);
  if (valueInt < 1 || valueInt > 10) return null;
  if (Math.abs(n * 2 - valueInt) > 1e-9) return null;
  return valueInt;
};

const normalizeReasonTags = (reasons: any): string[] => {
  if (!Array.isArray(reasons)) return [];
  return reasons
    .filter((x): x is string => typeof x === 'string')
    .map(x => x.trim())
    .filter(x => x.length > 0 && x.length <= 12)
    .slice(0, 5);
};

// 评分理由标签预设
export const RATING_REASON_TAGS = [
  '剧情精彩', '人物立体', '文笔优美', '设定新颖', 
  '节奏紧凑', '情感真挚', '脑洞大开', '逻辑严密',
  '更新稳定', '互动性强', '值得收藏', '强烈推荐'
];

// ==================== 统计构建函数 ====================
interface InteractionStats {
  targetType: string;
  targetId: string;
  likeCount: number;
  shareCount: number;
  ratingCount: number;
  ratingAvg: number;
  ratingDist: Record<string, number>;
  liked: boolean;
  myRating: number | null;
  myReasonTags: string[];
}

const buildStats = async (targetType: TargetType, targetId: string, userId?: string): Promise<InteractionStats> => {
  const startTime = Date.now();
  
  // 并行查询所有数据
  const [stat, liked, myRating, dist] = await Promise.all([
    prisma.interactionStat.findUnique({
      where: { targetType_targetId: { targetType, targetId } },
    }),
    userId ? prisma.like.findUnique({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
      select: { id: true },
    }) : Promise.resolve(null),
    userId ? prisma.rating.findUnique({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
      select: { valueInt: true, reasonTags: true },
    }) : Promise.resolve(null),
    prisma.rating.groupBy({
      by: ['valueInt'],
      where: { targetType, targetId },
      _count: { valueInt: true },
    }),
  ]);
  
  const likeCount = stat?.likeCount || 0;
  const shareCount = stat?.shareCount || 0;
  const ratingCount = stat?.ratingCount || 0;
  const ratingSum = stat?.ratingSum || 0;
  const ratingAvg = ratingCount > 0 ? Math.round((ratingSum / ratingCount / 2) * 10) / 10 : 0;
  
  const ratingDist: Record<string, number> = {};
  dist.forEach(row => {
    ratingDist[String(row.valueInt)] = row._count.valueInt;
  });
  
  return {
    targetType,
    targetId,
    likeCount,
    shareCount,
    ratingCount,
    ratingAvg,
    ratingDist,
    liked: !!liked,
    myRating: myRating ? myRating.valueInt / 2 : null,
    myReasonTags: myRating?.reasonTags ? JSON.parse(myRating.reasonTags) : [],
  };
};

// ==================== 防刷检测 ====================
interface FraudCheckResult {
  isFraud: boolean;
  reason?: string;
  confidence: number; // 0-1
}

const checkFraudPatterns = (req: OptionalAuthRequest, action: string, targetType: string, targetId: string): FraudCheckResult => {
  const { fingerprint, ip } = req.clientInfo || { fingerprint: 'unknown', ip: 'unknown' };
  const userId = req.user?.id;
  
  // 基础检查
  if (!userId && action !== 'share') {
    return { isFraud: false, confidence: 0 }; // 未登录用户只能分享
  }
  
  // 检查异常请求模式
  const recentEvents = eventBuffer.filter(e => 
    e.fingerprint === fingerprint && 
    e.timestamp > Date.now() - 60000
  );
  
  // 1. 高频操作检测
  const sameTargetRecent = recentEvents.filter(e => 
    e.targetType === targetType && e.targetId === targetId
  );
  if (sameTargetRecent.length > 5) {
    return { 
      isFraud: true, 
      reason: 'Too many actions on same target',
      confidence: Math.min(sameTargetRecent.length / 10, 1)
    };
  }
  
  // 2. 多目标刷量检测
  const uniqueTargets = new Set(recentEvents.map(e => `${e.targetType}:${e.targetId}`));
  if (uniqueTargets.size > 20) {
    return { 
      isFraud: true, 
      reason: 'Too many unique targets in short time',
      confidence: Math.min(uniqueTargets.size / 50, 1)
    };
  }
  
  // 3. 时间模式检测 (过于规律的请求间隔)
  if (recentEvents.length >= 3) {
    const intervals = [];
    for (let i = 1; i < recentEvents.length; i++) {
      intervals.push(recentEvents[i].timestamp - recentEvents[i-1].timestamp);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
    
    // 如果方差很小，可能是机器人
    if (variance < 100 && recentEvents.length > 5) {
      return { 
        isFraud: true, 
        reason: 'Suspicious timing pattern (bot-like)',
        confidence: 0.8
      };
    }
  }
  
  return { isFraud: false, confidence: 0 };
};

// ==================== API路由 ====================

// 获取互动统计
router.get('/:targetType/:targetId', optionalAuth, async (req: OptionalAuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const startTime = Date.now();
  const targetTypeRaw = String(req.params.targetType || '');
  const targetId = String(req.params.targetId || '');
  
  if (!isTargetType(targetTypeRaw)) {
    return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetType', traceId, 400);
  }
  if (!targetId) {
    return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetId', traceId, 400);
  }
  
  // 限流检查
  const rateLimitKey = `stats:${req.clientInfo?.fingerprint || req.ip}`;
  const rateLimit = checkRateLimit(rateLimitKey, 'stats');
  if (!rateLimit.allowed) {
    return sendErr(res, 'RATE_LIMITED', rateLimit.blocked ? 'Temporarily blocked due to excessive requests' : 'Too many requests', traceId, 429);
  }
  
  try {
    // 缓存检查 (仅对未登录用户)
    const cacheKey = keyOf(targetTypeRaw, targetId);
    if (!req.user) {
      const cached = cacheGet(cacheKey);
      if (cached) {
        trackEvent(req, 'view_stats', targetTypeRaw, targetId, { cached: true }, Date.now() - startTime);
        return sendOk(res, cached, traceId);
      }
    }
    
    // 检查目标是否存在
    const exists = await ensureTargetExists(targetTypeRaw, targetId);
    if (!exists) {
      return sendErr(res, 'NOT_FOUND', 'Target not found', traceId, 404);
    }
    
    // 构建统计
    const data = await buildStats(targetTypeRaw, targetId, req.user?.id);
    
    // 缓存结果
    if (!req.user) {
      cacheSet(cacheKey, data);
    }
    
    // 埋点
    trackEvent(req, 'view_stats', targetTypeRaw, targetId, { cached: false }, Date.now() - startTime);
    
    // 添加性能指标到响应头
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
    res.setHeader('X-RateLimit-Reset', String(rateLimit.resetAt));
    
    sendOk(res, data, traceId);
  } catch (e: any) {
    console.error('[Interactions] Get stats failed:', e);
    sendErr(res, 'INTERACTION_STATS_FAILED', e.message || 'Failed to get stats', traceId, 500);
  }
});

// 点赞/取消点赞
router.post('/:targetType/:targetId/like', optionalAuth, async (req: OptionalAuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const startTime = Date.now();
  const userId = req.user?.id;
  
  if (!userId) {
    return sendErr(res, 'UNAUTHORIZED', 'Login required', traceId, 401);
  }
  
  const targetTypeRaw = String(req.params.targetType || '');
  const targetId = String(req.params.targetId || '');
  
  if (!isTargetType(targetTypeRaw)) {
    return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetType', traceId, 400);
  }
  if (!targetId) {
    return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetId', traceId, 400);
  }
  
  // 限流检查
  const rlKey = rateLimitKey('like', userId);
  const rateLimit = checkRateLimit(rlKey, 'like');
  if (!rateLimit.allowed) {
    return sendErr(res, 'RATE_LIMITED', rateLimit.blocked ? 'Account temporarily restricted' : 'Too many requests', traceId, 429);
  }
  
  // 防刷检测
  const fraudCheck = checkFraudPatterns(req, 'like', targetTypeRaw, targetId);
  if (fraudCheck.isFraud && fraudCheck.confidence > 0.7) {
    console.warn(`[FraudDetection] Blocked like from user ${userId}: ${fraudCheck.reason}`);
    return sendErr(res, 'SUSPICIOUS_ACTIVITY', 'Activity detected as suspicious', traceId, 403);
  }
  
  try {
    const exists = await ensureTargetExists(targetTypeRaw, targetId);
    if (!exists) {
      return sendErr(res, 'NOT_FOUND', 'Target not found', traceId, 404);
    }
    
    // 清除缓存
    cacheDel(keyOf(targetTypeRaw, targetId));
    
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.like.findUnique({
        where: { userId_targetType_targetId: { userId, targetType: targetTypeRaw, targetId } },
        select: { id: true },
      });
      
      if (existing) {
        // 取消点赞
        await tx.like.delete({ where: { id: existing.id } });
        await tx.interactionStat.upsert({
          where: { targetType_targetId: { targetType: targetTypeRaw, targetId } },
          create: { targetType: targetTypeRaw, targetId, likeCount: 0 },
          update: { likeCount: { decrement: 1 } },
        });
        
        trackEvent(req, 'unlike', targetTypeRaw, targetId, { fraudConfidence: fraudCheck.confidence });
        return { liked: false };
      }
      
      // 新增点赞
      await tx.like.create({ 
        data: { 
          userId, 
          targetType: targetTypeRaw, 
          targetId,
        } 
      });
      await tx.interactionStat.upsert({
        where: { targetType_targetId: { targetType: targetTypeRaw, targetId } },
        create: { targetType: targetTypeRaw, targetId, likeCount: 1 },
        update: { likeCount: { increment: 1 } },
      });
      
      trackEvent(req, 'like', targetTypeRaw, targetId, { fraudConfidence: fraudCheck.confidence });
      return { liked: true };
    });
    
    // 获取最新计数
    const stat = await prisma.interactionStat.findUnique({
      where: { targetType_targetId: { targetType: targetTypeRaw, targetId } },
      select: { likeCount: true },
    });
    
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
    
    sendOk(res, { 
      ...result, 
      likeCount: Math.max(0, stat?.likeCount || 0),
      fraudCheck: fraudCheck.confidence > 0 ? { warning: true, confidence: fraudCheck.confidence } : undefined
    }, traceId);
  } catch (e: any) {
    console.error('[Interactions] Like failed:', e);
    sendErr(res, 'LIKE_FAILED', e.message || 'Failed to like', traceId, 500);
  }
});

// 提交/修改评分
router.put('/:targetType/:targetId/rating', optionalAuth, async (req: OptionalAuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const startTime = Date.now();
  const userId = req.user?.id;
  
  if (!userId) {
    return sendErr(res, 'UNAUTHORIZED', 'Login required', traceId, 401);
  }
  
  const targetTypeRaw = String(req.params.targetType || '');
  const targetId = String(req.params.targetId || '');
  
  if (!isTargetType(targetTypeRaw)) {
    return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetType', traceId, 400);
  }
  if (!targetId) {
    return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetId', traceId, 400);
  }
  
  // 限流检查
  const rlKey = rateLimitKey('rating', userId);
  const rateLimit = checkRateLimit(rlKey, 'rating');
  if (!rateLimit.allowed) {
    return sendErr(res, 'RATE_LIMITED', rateLimit.blocked ? 'Account temporarily restricted' : 'Too many requests', traceId, 429);
  }
  
  // 评分值验证
  const valueInt = toValueInt(req.body?.score);
  if (!valueInt) {
    return sendErr(res, 'VALIDATION_ERROR', 'score must be 0.5-5.0 with 0.5 steps', traceId, 400);
  }
  
  // 评分理由标签
  const reasonTags = normalizeReasonTags(req.body?.reasonTags);
  
  // 防刷检测
  const fraudCheck = checkFraudPatterns(req, 'rate', targetTypeRaw, targetId);
  if (fraudCheck.isFraud && fraudCheck.confidence > 0.7) {
    return sendErr(res, 'SUSPICIOUS_ACTIVITY', 'Activity detected as suspicious', traceId, 403);
  }
  
  try {
    const exists = await ensureTargetExists(targetTypeRaw, targetId);
    if (!exists) {
      return sendErr(res, 'NOT_FOUND', 'Target not found', traceId, 404);
    }
    
    // 清除缓存
    cacheDel(keyOf(targetTypeRaw, targetId));
    
    await prisma.$transaction(async (tx) => {
      const existing = await tx.rating.findUnique({
        where: { userId_targetType_targetId: { userId, targetType: targetTypeRaw, targetId } },
        select: { id: true, valueInt: true },
      });
      
      if (!existing) {
        // 首次评分
        await tx.rating.create({
          data: {
            userId,
            targetType: targetTypeRaw,
            targetId,
            valueInt,
            reasonTags: JSON.stringify(reasonTags),
          },
        });
        await tx.interactionStat.upsert({
          where: { targetType_targetId: { targetType: targetTypeRaw, targetId } },
          create: { targetType: targetTypeRaw, targetId, ratingCount: 1, ratingSum: valueInt },
          update: { ratingCount: { increment: 1 }, ratingSum: { increment: valueInt } },
        });
      } else {
        // 修改评分
        const delta = valueInt - existing.valueInt;
        await tx.rating.update({
          where: { id: existing.id },
          data: { valueInt, reasonTags: JSON.stringify(reasonTags) },
        });
        await tx.interactionStat.upsert({
          where: { targetType_targetId: { targetType: targetTypeRaw, targetId } },
          create: { targetType: targetTypeRaw, targetId, ratingCount: 1, ratingSum: valueInt },
          update: { ratingSum: { increment: delta } },
        });
      }
    });
    
    trackEvent(req, 'rate', targetTypeRaw, targetId, { 
      score: valueInt / 2, 
      reasonTags,
      fraudConfidence: fraudCheck.confidence 
    });
    
    // 返回最新统计
    const data = await buildStats(targetTypeRaw, targetId, userId);
    
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
    
    sendOk(res, data, traceId);
  } catch (e: any) {
    console.error('[Interactions] Rating failed:', e);
    sendErr(res, 'RATING_FAILED', e.message || 'Failed to rate', traceId, 500);
  }
});

// 记录分享
router.post('/:targetType/:targetId/share', optionalAuth, async (req: OptionalAuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const startTime = Date.now();
  const targetTypeRaw = String(req.params.targetType || '');
  const targetId = String(req.params.targetId || '');
  
  if (!isTargetType(targetTypeRaw)) {
    return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetType', traceId, 400);
  }
  if (!targetId) {
    return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetId', traceId, 400);
  }
  
  // 分享限流 (基于用户ID或IP)
  const actor = req.user?.id || req.clientInfo?.fingerprint || req.ip;
  const rlKey = rateLimitKey('share', actor as string);
  const rateLimit = checkRateLimit(rlKey, 'share');
  if (!rateLimit.allowed) {
    return sendErr(res, 'RATE_LIMITED', 'Too many share requests', traceId, 429);
  }
  
  try {
    const exists = await ensureTargetExists(targetTypeRaw, targetId);
    if (!exists) {
      return sendErr(res, 'NOT_FOUND', 'Target not found', traceId, 404);
    }
    
    // 清除缓存
    cacheDel(keyOf(targetTypeRaw, targetId));
    
    const stat = await prisma.interactionStat.upsert({
      where: { targetType_targetId: { targetType: targetTypeRaw, targetId } },
      create: { targetType: targetTypeRaw, targetId, shareCount: 1 },
      update: { shareCount: { increment: 1 } },
      select: { shareCount: true },
    });
    
    trackEvent(req, 'share', targetTypeRaw, targetId, { 
      platform: req.body?.platform || 'unknown',
      userId: req.user?.id 
    });
    
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    
    sendOk(res, { shareCount: stat.shareCount }, traceId);
  } catch (e: any) {
    console.error('[Interactions] Share failed:', e);
    sendErr(res, 'SHARE_FAILED', e.message || 'Failed to share', traceId, 500);
  }
});

// 获取评分理由标签预设
router.get('/rating-reason-tags', (_req: Request, res: Response) => {
  sendOk(res, { tags: RATING_REASON_TAGS });
});

// 健康检查端点
router.get('/health', (_req: Request, res: Response) => {
  const cacheSize = statsCache.size;
  const eventQueueSize = eventBuffer.length;
  
  sendOk(res, {
    status: 'ok',
    cache: { size: cacheSize },
    analytics: { queuedEvents: eventQueueSize },
    rateLimit: { activeBuckets: rateLimitBuckets.size },
  });
});

export default router;
