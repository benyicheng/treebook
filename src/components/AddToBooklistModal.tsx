import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { booklistService, Booklist } from '../api/storyService';
import { useAuthStore } from '../stores/useAuthStore';
import { useToast } from './Toast';
import { Link } from 'react-router-dom';
import { BookMarked, CheckCircle2 } from 'lucide-react';

interface AddToBooklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  chapterTitle?: string;
}

const AddToBooklistModal: React.FC<AddToBooklistModalProps> = ({
  isOpen,
  onClose,
  chapterId,
  chapterTitle,
}) => {
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  const [myBooklists, setMyBooklists] = useState<Booklist[]>([]);
  const [selectedBooklistId, setSelectedBooklistId] = useState('');
  const [booklistNote, setBooklistNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [isLoadingBooklists, setIsLoadingBooklists] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      setAddSuccess(false);
      setBooklistNote('');
      setSelectedBooklistId('');
      fetchMyBooklists();
    }
  }, [isOpen, isAuthenticated]);

  const fetchMyBooklists = async () => {
    setIsLoadingBooklists(true);
    try {
      const data = await booklistService.getMy();
      setMyBooklists(data);
      if (data.length > 0) setSelectedBooklistId(data[0].id);
    } catch (err) {
      console.error('Failed to fetch booklists');
    } finally {
      setIsLoadingBooklists(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooklistId || !chapterId) return;

    setIsAdding(true);
    try {
      await booklistService.addItem(selectedBooklistId, {
        chapterId,
        notes: booklistNote,
      });
      setAddSuccess(true);
      setTimeout(() => {
        onClose();
        setAddSuccess(false);
        setBooklistNote('');
      }, 1500);
    } catch (err: any) {
      if (err.response?.data?.message === 'Chapter already in booklist') {
        addToast('info', '该章节已在书单中');
      } else {
        addToast('error', '添加失败，请重试');
      }
    } finally {
      setIsAdding(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="加入书单">
        <div className="py-8 text-center space-y-4">
          <BookMarked size={40} className="mx-auto text-ink-300" />
          <p className="text-ink-500 font-medium">请先登录后再加入书单</p>
          <Link
            to="/login"
            className="inline-block px-6 py-2 bg-accent-500 text-white rounded-xl font-bold text-sm hover:bg-accent-600 transition-all"
          >
            去登录
          </Link>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="加入我的精选书单">
      {addSuccess ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-accent-100 dark:bg-accent-500/15 text-accent-500 rounded-full flex items-center justify-center">
            <CheckCircle2 size={40} />
          </div>
          <p className="text-xl font-black text-ink-800 dark:text-white">成功加入书单！</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {chapterTitle && (
            <div className="p-3 bg-ink-50 dark:bg-ink-800 rounded-xl">
              <p className="text-xs font-black uppercase tracking-widest text-ink-400 mb-1">章节</p>
              <p className="text-sm font-bold text-ink-600 dark:text-ink-300 line-clamp-2">{chapterTitle}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">选择书单</label>
            {isLoadingBooklists ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-500"></div>
              </div>
            ) : myBooklists.length > 0 ? (
              <select
                className="w-full px-4 py-3 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-accent-400 outline-none transition-all"
                value={selectedBooklistId}
                onChange={e => setSelectedBooklistId(e.target.value)}
              >
                {myBooklists.map(list => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-4 bg-ink-50 dark:bg-ink-800 rounded-xl text-center">
                <p className="text-sm text-ink-500 mb-2">你还没有创建过书单</p>
                <Link
                  to="/booklist"
                  className="text-accent-500 text-xs font-bold hover:underline"
                >
                  去创建一个新书单
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">导游点评（可选）</label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-accent-400 outline-none transition-all resize-none"
              placeholder="为这一站写点推荐语，告诉读者为什么要读这一章..."
              value={booklistNote}
              onChange={e => setBooklistNote(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-ink-100 text-ink-600 rounded-xl font-bold hover:bg-ink-200 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isAdding || !selectedBooklistId}
              className="flex-1 py-3 bg-accent-500 text-white rounded-2xl font-black hover:bg-accent-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? '正在加入...' : '确认加入'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default AddToBooklistModal;
