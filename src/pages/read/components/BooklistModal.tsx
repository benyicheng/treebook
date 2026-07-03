import React from 'react';
import { Modal } from '../../../components/ui';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BooklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  myBooklists: any[];
  selectedBooklistId: string;
  onSelectBooklist: (id: string) => void;
  booklistNote: string;
  onBooklistNoteChange: (note: string) => void;
  isAdding: boolean;
  addSuccess: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const BooklistModal: React.FC<BooklistModalProps> = ({
  isOpen,
  onClose,
  myBooklists,
  selectedBooklistId,
  onSelectBooklist,
  booklistNote,
  onBooklistNoteChange,
  isAdding,
  addSuccess,
  onSubmit,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="加入我的精选书单">
      {addSuccess ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-accent-50 text-accent-500 rounded-full flex items-center justify-center">
            <CheckCircle2 size={40} />
          </div>
          <p className="text-xl font-black text-ink-700">成功加入书单！</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6 p-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">选择书单</label>
            {myBooklists.length > 0 ? (
              <select
                className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-ink-50 text-sm focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all"
                value={selectedBooklistId}
                onChange={(e) => onSelectBooklist(e.target.value)}
              >
                {myBooklists.map((list: any) => (
                  <option key={list.id} value={list.id}>{list.title}</option>
                ))}
              </select>
            ) : (
              <div className="p-4 bg-ink-50 rounded-lg text-center">
                <p className="text-sm text-ink-400 mb-2">你还没有创建过书单</p>
                <Link to="/booklist" className="text-accent-500 text-xs font-bold hover:underline">
                  去创建一个新书单
                </Link>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">导游点评 (可选)</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-ink-200 bg-ink-50 text-sm focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all resize-none"
              placeholder="为这一站写点推荐语..."
              value={booklistNote}
              onChange={(e) => onBooklistNoteChange(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isAdding || !selectedBooklistId}
            className="w-full h-12 bg-accent-500 text-white rounded-lg font-bold hover:bg-accent-600 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isAdding ? '正在加入...' : '确认加入书单'}
          </button>
        </form>
      )}
    </Modal>
  );
};

export default BooklistModal;