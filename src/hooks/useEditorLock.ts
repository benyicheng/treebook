import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/useAuthStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface LockInfo {
  userId: string;
  username: string;
}

export const useEditorLock = (chapterId: string, storyId?: string) => {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [isLockedByOthers, setIsLockedByOthers] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(SOCKET_URL, {
      auth: { token },
    });
    setSocket(newSocket);

    const roomId = storyId || 'global';
    newSocket.emit('join-room', roomId);

    // Initial lock request
    if (user) {
      newSocket.emit('request-lock', {
        chapterId,
        roomId
      });
    }

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
        
        // Retry lock acquisition if current user wants to edit
        if (user) {
          newSocket.emit('request-lock', {
            chapterId,
            roomId
          });
        }
      }
    });

    newSocket.on('lock-denied', (data: any) => {
      if (data.chapterId === chapterId) {
        setIsLockedByOthers(true);
        setLockInfo({ userId: 'other', username: data.lockedBy });
      }
    });

    return () => {
      newSocket.emit('release-lock', { chapterId, roomId });
      newSocket.disconnect();
    };
  }, [chapterId, storyId, user]);

  return {
    socket,
    lockInfo,
    isLockedByOthers
  };
};
