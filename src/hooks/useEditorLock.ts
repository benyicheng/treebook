import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/useAuthStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const HEARTBEAT_INTERVAL = 60 * 1000; // 1 分钟续期一次，远小于服务端 5 分钟 TTL

interface LockInfo {
  userId: string;
  username: string;
  /** 锁获取时间（毫秒），用于展示编辑时长 */
  acquiredAt?: number;
}

async function getFreshToken(): Promise<string | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;
  // Try refreshing the token if it might be expired
  try {
    const res = await fetch(`${SOCKET_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.token) {
        localStorage.setItem('token', data.data.token);
        return data.data.token;
      }
    }
  } catch {}
  return token;
}

export const useEditorLock = (chapterId: string, storyId?: string) => {
  const { user } = useAuthStore();
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [isLockedByOthers, setIsLockedByOthers] = useState(false);
  const [isHolder, setIsHolder] = useState(false);
  /** 持有者广播过来的最新内容（供只读浏览者实时镜像） */
  const [remoteContent, setRemoteContent] = useState<string | null>(null);
  /** 有其他人请求接管编辑时的提示（持有者可见） */
  const [takeoverRequestedBy, setTakeoverRequestedBy] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const roomId = storyId || 'global';

  /** 持有者调用：把当前内容广播给房间内的只读浏览者 */
  const broadcastContent = useCallback((content: string) => {
    socketRef.current?.emit('content-change', { chapterId, roomId, content });
  }, [chapterId, roomId]);

  /** 浏览者调用：请求接管编辑，通知当前持有者 */
  const requestTakeover = useCallback(() => {
    socketRef.current?.emit('request-takeover', {
      chapterId,
      roomId,
      username: user?.username || user?.email,
    });
  }, [chapterId, roomId, user]);

  const clearTakeoverRequest = useCallback(() => setTakeoverRequestedBy(null), []);

  useEffect(() => {
    let newSocket: Socket | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    async function connectSocket() {
      const token = await getFreshToken();
      if (!token) return;

      newSocket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 5,
      });
      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        newSocket!.emit('join-room', roomId);
        if (user) {
          newSocket!.emit('request-lock', { chapterId, roomId });
        }
      });

      newSocket.on('connect_error', async () => {
        // Auth failure — try refreshing the token and reconnect
        const fresh = await getFreshToken();
        if (fresh && fresh !== token && newSocket) {
          newSocket.auth = { token: fresh };
          newSocket.connect();
        }
      });

      newSocket.on('locks-update', (locks: Record<string, LockInfo>) => {
        if (locks[chapterId] && locks[chapterId].userId !== user?.id) {
          setLockInfo(locks[chapterId]);
          setIsLockedByOthers(true);
          setIsHolder(false);
        }
      });

      newSocket.on('lock-acquired', (data: LockInfo & { chapterId: string }) => {
        if (data.chapterId !== chapterId) return;
        if (data.userId !== user?.id) {
          setLockInfo({ userId: data.userId, username: data.username, acquiredAt: data.acquiredAt });
          setIsLockedByOthers(true);
          setIsHolder(false);
        } else {
          setIsLockedByOthers(false);
          setLockInfo(null);
          setIsHolder(true);
          setRemoteContent(null);
        }
      });

      newSocket.on('lock-released', (data: { chapterId: string }) => {
        if (data.chapterId !== chapterId) return;
        setIsLockedByOthers(false);
        setLockInfo(null);
        setRemoteContent(null);
        if (user) {
          newSocket!.emit('request-lock', { chapterId, roomId });
        }
      });

      newSocket.on('lock-denied', (data: { chapterId: string; lockedBy: string; acquiredAt?: number }) => {
        if (data.chapterId === chapterId) {
          setIsLockedByOthers(true);
          setIsHolder(false);
          setLockInfo({ userId: 'other', username: data.lockedBy, acquiredAt: data.acquiredAt });
        }
      });

      // 只读实时镜像：接收持有者广播的内容
      newSocket.on('content-update', (data: { chapterId?: string; content?: unknown }) => {
        if (data.chapterId === chapterId && typeof data.content === 'string') {
          setRemoteContent(data.content);
        }
      });

      // 接管请求（持有者收到）
      newSocket.on('takeover-requested', (data: { chapterId: string; username?: string }) => {
        if (data.chapterId === chapterId) {
          setTakeoverRequestedBy(data.username || '某位协作者');
        }
      });

      // 心跳续期：始终发送，服务端仅在本 socket 持有锁时刷新活跃时间
      heartbeat = setInterval(() => {
        newSocket?.emit('lock-heartbeat', { chapterId, roomId });
      }, HEARTBEAT_INTERVAL);
    }

    connectSocket();

    return () => {
      if (heartbeat) clearInterval(heartbeat);
      if (newSocket) {
        newSocket.emit('release-lock', { chapterId, roomId });
        newSocket.disconnect();
      }
      socketRef.current = null;
    };
  }, [chapterId, roomId, user?.id]);

  return {
    socket: socketRef.current,
    lockInfo,
    isLockedByOthers,
    isHolder,
    remoteContent,
    broadcastContent,
    requestTakeover,
    takeoverRequestedBy,
    clearTakeoverRequest,
  };
};
