import { Router } from 'express';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { sendErr, sendOk } from '../utils/http';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const router = Router();

type TargetType = 'story' | 'chapter' | 'booklist' | 'spinoff';

type OptionalAuthRequest = Request & { user?: { id: string; role: string; permissions?: string[] }; traceId?: string };

const optionalAuth = (req: OptionalAuthRequest, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
  } catch {}
  next();
};

const getTraceId = (req: any) => req.traceId as string | undefined;

const isTargetType = (t: string): t is TargetType => t === 'story' || t === 'chapter' || t === 'booklist' || t === 'spinoff';

const keyOf = (targetType: string, targetId: string) => `${targetType}:${targetId}`;

const statsCache = new Map<string, { expiresAt: number; data: any }>();
const cacheGet = (k: string) => {
  const v = statsCache.get(k);
  if (!v) return null;
  if (v.expiresAt <= Date.now()) {
    statsCache.delete(k);
    return null;
  }
  return v.data;
};
const cacheSet = (k: string, data: any, ttlMs: number) => {
  statsCache.set(k, { expiresAt: Date.now() + ttlMs, data });
};
const cacheDel = (k: string) => {
  statsCache.delete(k);
};

const buckets = new Map<string, { resetAt: number; count: number }>();
const allow = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { resetAt: now + windowMs, count: 1 });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
};

const ensureTargetExists = async (targetType: TargetType, targetId: string) => {
  if (targetType === 'story') {
    const story = await prisma.story.findUnique({ where: { id: targetId }, select: { id: true } });
    return !!story;
  }
  if (targetType === 'chapter') {
    const chapter = await prisma.chapter.findUnique({ where: { id: targetId }, select: { id: true } });
    return !!chapter;
  }
  if (targetType === 'booklist') {
    const booklist = await prisma.booklist.findUnique({ where: { id: targetId }, select: { id: true } });
    return !!booklist;
  }
  const spinoff = await prisma.spinoff.findUnique({ where: { id: targetId }, select: { id: true } });
  return !!spinoff;
};

const toValueInt = (score: any) => {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  const valueInt = Math.round(n * 2);
  if (valueInt < 1 || valueInt > 10) return null;
  if (Math.abs(n * 2 - valueInt) > 1e-9) return null;
  return valueInt;
};

const normalizeReasonTags = (reasons: any) => {
  if (!Array.isArray(reasons)) return [];
  const tags = reasons
    .filter((x) => typeof x === 'string')
    .map((x) => x.trim())
    .filter((x) => x.length > 0 && x.length <= 12);
  return Array.from(new Set(tags)).slice(0, 5);
};

const buildStats = async (targetType: TargetType, targetId: string, userId?: string) => {
  const stat = await prisma.interactionStat.findUnique({
    where: { targetType_targetId: { targetType, targetId } },
  });

  const likeCount = stat?.likeCount || 0;
  const shareCount = stat?.shareCount || 0;
  const ratingCount = stat?.ratingCount || 0;
  const ratingSum = stat?.ratingSum || 0;
  const ratingAvg = ratingCount > 0 ? ratingSum / ratingCount / 2 : 0;

  const [liked, myRating, dist] = await Promise.all([
    userId
      ? prisma.like.findUnique({
          where: { userId_targetType_targetId: { userId, targetType, targetId } },
          select: { id: true },
        })
      : Promise.resolve(null),
    userId
      ? prisma.rating.findUnique({
          where: { userId_targetType_targetId: { userId, targetType, targetId } },
          select: { valueInt: true, reasonTags: true },
        })
      : Promise.resolve(null),
    prisma.rating.groupBy({
      by: ['valueInt'],
      where: { targetType, targetId },
      _count: { valueInt: true },
    }),
  ]);

  const ratingDist: Record<string, number> = {};
  dist.forEach((row) => {
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
    myReasonTags: myRating?.reasonTags ? (JSON.parse(myRating.reasonTags) as string[]) : [],
  };
};

router.get('/:targetType/:targetId', optionalAuth, async (req: OptionalAuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const targetTypeRaw = String(req.params.targetType || '');
  const targetId = String(req.params.targetId || '');

  if (!isTargetType(targetTypeRaw)) return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetType', traceId, 400);
  if (!targetId) return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetId', traceId, 400);

  const cached = cacheGet(keyOf(targetTypeRaw, targetId));
  if (cached && !req.user) return sendOk(res, cached, traceId);

  try {
    const exists = await ensureTargetExists(targetTypeRaw, targetId);
    if (!exists) return sendErr(res, 'NOT_FOUND', 'Target not found', traceId, 404);

    const data = await buildStats(targetTypeRaw, targetId, req.user?.id);
    if (!req.user) cacheSet(keyOf(targetTypeRaw, targetId), data, 30_000);
    sendOk(res, data, traceId);
  } catch (e: any) {
    sendErr(res, 'INTERACTION_STATS_FAILED', e.message || 'Failed to get stats', traceId, 500);
  }
});

router.post('/:targetType/:targetId/like', optionalAuth, async (req: OptionalAuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const userId = req.user?.id;
  if (!userId) return sendErr(res, 'UNAUTHORIZED', 'Login required', traceId, 401);

  const targetTypeRaw = String(req.params.targetType || '');
  const targetId = String(req.params.targetId || '');
  if (!isTargetType(targetTypeRaw)) return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetType', traceId, 400);
  if (!targetId) return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetId', traceId, 400);

  const rlKey = `like:${userId}`;
  if (!allow(rlKey, 30, 60_000)) return sendErr(res, 'RATE_LIMITED', 'Too many requests', traceId, 429);

  try {
    const exists = await ensureTargetExists(targetTypeRaw, targetId);
    if (!exists) return sendErr(res, 'NOT_FOUND', 'Target not found', traceId, 404);

    const k = keyOf(targetTypeRaw, targetId);
    cacheDel(k);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.like.findUnique({
        where: { userId_targetType_targetId: { userId, targetType: targetTypeRaw, targetId } },
        select: { id: true },
      });

      if (existing) {
        await tx.like.delete({ where: { id: existing.id } });
        await tx.interactionStat.upsert({
          where: { targetType_targetId: { targetType: targetTypeRaw, targetId } },
          create: { targetType: targetTypeRaw, targetId, likeCount: 0 },
          update: { likeCount: { decrement: 1 } },
        });
        return { liked: false };
      }

      await tx.like.create({ data: { userId, targetType: targetTypeRaw, targetId } });
      await tx.interactionStat.upsert({
        where: { targetType_targetId: { targetType: targetTypeRaw, targetId } },
        create: { targetType: targetTypeRaw, targetId, likeCount: 1 },
        update: { likeCount: { increment: 1 } },
      });
      return { liked: true };
    });

    const stat = await prisma.interactionStat.findUnique({
      where: { targetType_targetId: { targetType: targetTypeRaw, targetId } },
      select: { likeCount: true },
    });

    sendOk(res, { ...result, likeCount: Math.max(0, stat?.likeCount || 0) }, traceId);
  } catch (e: any) {
    sendErr(res, 'LIKE_FAILED', e.message || 'Failed to like', traceId, 500);
  }
});

router.put('/:targetType/:targetId/rating', optionalAuth, async (req: OptionalAuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const userId = req.user?.id;
  if (!userId) return sendErr(res, 'UNAUTHORIZED', 'Login required', traceId, 401);

  const targetTypeRaw = String(req.params.targetType || '');
  const targetId = String(req.params.targetId || '');
  if (!isTargetType(targetTypeRaw)) return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetType', traceId, 400);
  if (!targetId) return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetId', traceId, 400);

  const rlKey = `rating:${userId}`;
  if (!allow(rlKey, 20, 60_000)) return sendErr(res, 'RATE_LIMITED', 'Too many requests', traceId, 429);

  // Debug log
  console.log('[Rating Debug] req.body:', req.body);
  console.log('[Rating Debug] score:', req.body?.score);

  const valueInt = toValueInt(req.body?.score);
  console.log('[Rating Debug] valueInt:', valueInt);

  if (!valueInt) return sendErr(res, 'VALIDATION_ERROR', 'score must be 0.5-5.0 with 0.5 steps', traceId, 400);

  const reasonTags = normalizeReasonTags(req.body?.reasonTags);

  try {
    const exists = await ensureTargetExists(targetTypeRaw, targetId);
    if (!exists) return sendErr(res, 'NOT_FOUND', 'Target not found', traceId, 404);

    const k = keyOf(targetTypeRaw, targetId);
    cacheDel(k);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.rating.findUnique({
        where: { userId_targetType_targetId: { userId, targetType: targetTypeRaw, targetId } },
        select: { id: true, valueInt: true },
      });

      if (!existing) {
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
        return;
      }

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
    });

    const data = await buildStats(targetTypeRaw, targetId, userId);
    sendOk(res, data, traceId);
  } catch (e: any) {
    sendErr(res, 'RATING_FAILED', e.message || 'Failed to rate', traceId, 500);
  }
});

router.post('/:targetType/:targetId/share', optionalAuth, async (req: OptionalAuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const targetTypeRaw = String(req.params.targetType || '');
  const targetId = String(req.params.targetId || '');
  if (!isTargetType(targetTypeRaw)) return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetType', traceId, 400);
  if (!targetId) return sendErr(res, 'VALIDATION_ERROR', 'Invalid targetId', traceId, 400);

  const actor = req.user?.id || req.ip;
  const rlKey = `share:${actor}`;
  if (!allow(rlKey, 60, 60_000)) return sendErr(res, 'RATE_LIMITED', 'Too many requests', traceId, 429);

  try {
    const exists = await ensureTargetExists(targetTypeRaw, targetId);
    if (!exists) return sendErr(res, 'NOT_FOUND', 'Target not found', traceId, 404);

    const k = keyOf(targetTypeRaw, targetId);
    cacheDel(k);

    const stat = await prisma.interactionStat.upsert({
      where: { targetType_targetId: { targetType: targetTypeRaw, targetId } },
      create: { targetType: targetTypeRaw, targetId, shareCount: 1 },
      update: { shareCount: { increment: 1 } },
      select: { shareCount: true },
    });

    sendOk(res, { shareCount: stat.shareCount }, traceId);
  } catch (e: any) {
    sendErr(res, 'SHARE_FAILED', e.message || 'Failed to share', traceId, 500);
  }
});

export default router;

