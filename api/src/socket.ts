/**
 * Socket.IO server setup and collaborative editing logic.
 *
 * Extracted from index.ts to keep the main entry focused on Express wiring.
 * Handles: JWT auth middleware, room join, edit-lock lifecycle, content relay.
 */

import { Server } from 'socket.io';
import type { CorsOptions } from 'cors';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JwtPayload } from './config/jwt';
import { logger } from './utils/logger';

// ── Types ──────────────────────────────────────────────────────────────

/** Metadata for an active edit lock on a chapter. */
interface EditLock {
  userId: string;
  username: string;
  socketId: string;
  roomId: string;
  acquiredAt: number;   // 获取锁的时间（用于展示编辑时长，不因心跳重置）
  lastActiveAt: number; // 最近活跃时间（心跳刷新，用于 TTL 过期判定）
}

/** Lock state broadcast to clients (no internals). */
type LockInfo = Pick<EditLock, 'userId' | 'username' | 'acquiredAt'>;

/** Payload shape for `request-lock` / `release-lock` events. */
interface LockPayload {
  chapterId: string;
  roomId: string;
}

// ── Constants ──────────────────────────────────────────────────────────

const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── In-memory lock store ───────────────────────────────────────────────

const editLocks = new Map<string, EditLock>();

// Track which socket is in which room, so disconnect can scope broadcasts.
const socketRooms = new Map<string, string>(); // socketId → roomId

// ── Public helpers ─────────────────────────────────────────────────────

/**
 * Create and return a Socket.IO server bound to the given HTTP server.
 *
 * Authentication: every socket must present a valid JWT in `handshake.auth.token`.
 */
export function createSocketIOServer(
  httpServer: import('http').Server,
  corsOriginCallback: CorsOptions['origin'],
): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOriginCallback,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Socket auth middleware ───────────────────────────────────────────

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Socket authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET()) as JwtPayload;
      socket.data.user = decoded;
      next();
    } catch (err) {
      const e = err as Error;
      console.error('[Socket Auth] JWT verify failed:', e.message, e.name);
      next(new Error('Invalid socket token'));
    }
  });

  // ── Connection handler ──────────────────────────────────────────────

  io.on('connection', (socket) => {
    logger.debug('Socket connected', { socketId: socket.id, userId: socket.data.user?.id });

    // Join a collaboration room
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      socketRooms.set(socket.id, roomId);
      logger.debug('Socket joined room', { socketId: socket.id, roomId });

      // Send current lock state for chapters in THIS room only
      const roomLocks: Record<string, LockInfo> = {};
      editLocks.forEach((lock, chapterId) => {
        if (lock.roomId === roomId) {
          roomLocks[chapterId] = { userId: lock.userId, username: lock.username, acquiredAt: lock.acquiredAt };
        }
      });
      socket.emit('locks-update', roomLocks);
    });

    // Request an edit lock on a chapter
    socket.on('request-lock', (data: LockPayload) => {
      const userId = socket.data.user.id;
      const username = socket.data.user.email;
      const existingLock = editLocks.get(data.chapterId);

      if (!existingLock || existingLock.userId === userId) {
        const now = Date.now();
        const acquiredAt = existingLock && existingLock.userId === userId ? existingLock.acquiredAt : now;
        editLocks.set(data.chapterId, {
          userId,
          username,
          socketId: socket.id,
          roomId: data.roomId,
          acquiredAt,
          lastActiveAt: now,
        });

        io.to(data.roomId).emit('lock-acquired', {
          chapterId: data.chapterId,
          userId,
          username,
          acquiredAt,
        });
      } else {
        socket.emit('lock-denied', {
          chapterId: data.chapterId,
          lockedBy: existingLock.username,
          acquiredAt: existingLock.acquiredAt,
        });
      }
    });

    // Release an edit lock
    socket.on('release-lock', (data: LockPayload) => {
      const lock = editLocks.get(data.chapterId);
      if (lock && lock.socketId === socket.id) {
        editLocks.delete(data.chapterId);
        io.to(data.roomId).emit('lock-released', { chapterId: data.chapterId });
      }
    });

    // Relay content changes to room (except sender) — read-only live mirror
    socket.on('content-change', (data: { roomId: string; [key: string]: unknown }) => {
      socket.to(data.roomId).emit('content-update', data);
    });

    // Heartbeat: refresh the lock's activity time so an active editor isn't
    // expired by the TTL cleanup. Only the current holder's socket counts.
    socket.on('lock-heartbeat', (data: LockPayload) => {
      const lock = editLocks.get(data.chapterId);
      if (lock && lock.socketId === socket.id) {
        lock.lastActiveAt = Date.now();
      }
    });

    // A viewer requests to take over editing — notify the room so the current
    // holder sees the request (informational; holder chooses to leave).
    socket.on('request-takeover', (data: { chapterId: string; roomId: string; username?: string }) => {
      socket.to(data.roomId).emit('takeover-requested', {
        chapterId: data.chapterId,
        username: data.username || '某位协作者',
      });
    });

    // Disconnect: release all locks held by this socket
    socket.on('disconnect', () => {
      logger.debug('Socket disconnected', { socketId: socket.id });

      editLocks.forEach((lock, chapterId) => {
        if (lock.socketId === socket.id) {
          editLocks.delete(chapterId);
          // Scope broadcast to the room the lock belonged to (never global)
          io.to(lock.roomId).emit('lock-released', { chapterId });
        }
      });
      socketRooms.delete(socket.id);
    });
  });

  // ── TTL cleanup ─────────────────────────────────────────────────────

  setInterval(() => {
    const now = Date.now();
    editLocks.forEach((lock, chapterId) => {
      if (now - lock.lastActiveAt > LOCK_TTL_MS) {
        editLocks.delete(chapterId);
        // TTL expiry: broadcast to the lock's room only
        io.to(lock.roomId).emit('lock-released', { chapterId, reason: 'ttl_expired' });
      }
    });
  }, 60 * 1000);

  return io;
}
