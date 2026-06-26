import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/useAuthStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface LockInfo {
  userId: string;
  username: string;
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [isLockedByOthers, setIsLockedByOthers] = useState(false);

  useEffect(() => {
    let newSocket: Socket | null = null;

    async function connectSocket() {
      const token = await getFreshToken();
      if (!token) return;

      newSocket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 5,
      });
      setSocket(newSocket);

      const roomId = storyId || 'global';

      newSocket.on('connect', () => {
        newSocket!.emit('join-room', roomId);
        if (user) {
          newSocket!.emit('request-lock', { chapterId, roomId });
        }
      });

      newSocket.on('connect_error', async (err) => {
        // Auth failure — try refreshing the token and reconnect
        const fresh = await getFreshToken();
        if (fresh && fresh !== token && newSocket) {
          newSocket.auth = { token: fresh };
          newSocket.connect();
        }
      });

      newSocket.on('locks-update', (locks: any) => {
        if (locks[chapterId] && locks[chapterId].userId !== user?.id) {
          setLockInfo(locks[chapterId]);
          setIsLockedByOthers(true);
        }
      });

      newSocket.on('lock-acquired', (data: any) => {
        if (data.chapterId === chapterId) {
          if (data.userId !== user?.id) {
            setLockInfo({ userId: data.userId, username: data.username });
            setIsLockedByOthers(true);
          } else {
            setIsLockedByOthers(false);
            setLockInfo(null);
          }
        }
      });

      newSocket.on('lock-released', (data: any) => {
        if (data.chapterId === chapterId) {
          setIsLockedByOthers(false);
          setLockInfo(null);
          if (user) {
            newSocket!.emit('request-lock', { chapterId, roomId });
          }
        }
      });

      newSocket.on('lock-denied', (data: any) => {
        if (data.chapterId === chapterId) {
          setIsLockedByOthers(true);
          setLockInfo({ userId: 'other', username: data.lockedBy });
        }
      });
    }

    connectSocket();

    return () => {
      if (newSocket) {
        newSocket.emit('release-lock', { chapterId, roomId: storyId || 'global' });
        newSocket.disconnect();
      }
    };
  }, [chapterId, storyId, user]);

  return {
    socket,
    lockInfo,
    isLockedByOthers
  };
};
