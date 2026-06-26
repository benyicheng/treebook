import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, Check } from 'lucide-react';
import { Modal } from '../../../components/ui';
import { storyEventService, StoryEvent } from '../../../api/storyEventService';
import { EVENT_TYPES, EVENT_COLORS } from './eventConstants';
import { useToast } from '../../../components/notifications';

interface EventEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StoryEvent;
}

/**
 * 事件编辑弹窗 — 复用 CreateEventModal 的表单结构，预填已有值。
 * 调用 storyEventService.update，成功后 invalidate 事件详情查询。
 */
const EventEditModal: React.FC<EventEditModalProps> = ({ isOpen, onClose, event }) => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('main_arc');
  const [importance, setImportance] = useState(3);
  const [color, setColor] = useState('#f43f5e');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 预填已有值
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setType(event.type || 'main_arc');
      setImportance(event.importance || 3);
      setColor(event.color || '#f43f5e');
      setError('');
    }
  }, [event]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('请填写标题');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await storyEventService.update(event.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        importance,
        color,
      });
      queryClient.invalidateQueries({ queryKey: ['event', event.id] });
      addToast('success', '事件已更新');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || '更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="编辑大事件" size="lg">
      <div className="space-y-4">
        <input
          className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none focus:ring-2 focus:ring-accent-500"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="事件标题 *"
        />

        <textarea
          className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none focus:ring-2 focus:ring-accent-500 resize-none"
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="事件描述（可选）"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-ink-400 mb-1.5">类型</p>
            <select
              className="w-full px-3 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none focus:ring-2 focus:ring-accent-500"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              {EVENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs font-bold text-ink-400 mb-1.5">重要性</p>
            <div className="flex items-center gap-1 h-full">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setImportance(n)}
                  className={`w-full h-10 rounded-lg text-xs font-bold transition-colors ${
                    n <= importance ? 'bg-rose-500 text-white' : 'bg-ink-100 dark:bg-ink-600 text-ink-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-ink-400 mb-1.5">标识色</p>
          <div className="flex flex-wrap gap-2">
            {EVENT_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-ink-400 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 bg-ink-100 dark:bg-ink-700 rounded-xl font-bold hover:bg-ink-200 dark:hover:bg-ink-600 transition-colors">
            取消
          </button>
          <button onClick={handleSave} disabled={isSubmitting || !title.trim()}
            className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black disabled:opacity-50 hover:bg-rose-700 transition-colors">
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EventEditModal;
