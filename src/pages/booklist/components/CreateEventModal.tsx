import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar, Check, X } from 'lucide-react';
import { Modal } from '../../../components/ui';
import { storyService } from '../../../api/storyService';
import { storyEventService } from '../../../api/storyEventService';
import { EVENT_TYPES, EVENT_COLORS } from './eventConstants';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (eventId: string) => void;
  /** 预设故事 ID，传入时跳过"选故事"步骤直接进入表单 */
  presetStoryId?: string;
  presetStoryTitle?: string;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onCreated, presetStoryId, presetStoryTitle }) => {
  const [step, setStep] = useState<'story' | 'form'>(presetStoryId ? 'form' : 'story');
  const [storyQuery, setStoryQuery] = useState('');
  const [selectedStory, setSelectedStory] = useState<any>(presetStoryId ? { id: presetStoryId, title: presetStoryTitle || '已选故事' } : null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('main_arc');
  const [importance, setImportance] = useState(3);
  const [color, setColor] = useState('#f43f5e');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: storyResults = [], isLoading: isStoriesLoading } = useQuery({
    queryKey: ['stories', 'search', storyQuery],
    queryFn: () => storyService.getAll({ q: storyQuery }),
    enabled: storyQuery.trim().length > 0 && step === 'story',
  });

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(presetStoryId ? 'form' : 'story');
      setStoryQuery('');
      setSelectedStory(presetStoryId ? { id: presetStoryId, title: presetStoryTitle || '已选故事' } : null);
      setTitle('');
      setDescription('');
      setType('main_arc');
      setImportance(3);
      setColor('#f43f5e');
      setError('');
    }, 200);
  };

  const handleCreate = async () => {
    if (!selectedStory || !title.trim()) {
      setError('请选择故事并填写标题');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const event = await storyEventService.create({
        storyId: selectedStory.id,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        importance,
        color,
      });
      onCreated(event.id);
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || '创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={step === 'story' ? '选择故事' : '创建大事件'}>
      <div className="space-y-4">
        {step === 'story' ? (
          <>
            <p className="text-sm text-ink-500">大事件需要绑定到一个故事，请先选择所属故事</p>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none focus:ring-2 focus:ring-accent-500"
                value={storyQuery}
                onChange={e => setStoryQuery(e.target.value)}
                placeholder="搜索故事..."
              />
            </div>
            {selectedStory && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-accent-300 bg-accent-50">
                <div className="w-5 h-5 rounded bg-accent-500 flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{selectedStory.title}</p>
                  {selectedStory.author && (
                    <p className="text-xs text-ink-400">作者：{selectedStory.author.username || selectedStory.author}</p>
                  )}
                </div>
                <button onClick={() => setSelectedStory(null)} className="p-1 text-ink-400 hover:text-ink-600">
                  <X size={14} />
                </button>
              </div>
            )}
            {isStoriesLoading && <p className="text-sm text-ink-400 text-center py-4">搜索中...</p>}
            {!isStoriesLoading && storyQuery.trim().length > 0 && storyResults.length === 0 && (
              <p className="text-sm text-ink-400 text-center py-4">未找到匹配的故事</p>
            )}
            {!isStoriesLoading && storyResults.length > 0 && !selectedStory && (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {storyResults.map((story: any) => (
                  <div key={story.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 hover:bg-ink-50 cursor-pointer transition-colors"
                    onClick={() => { setSelectedStory(story); setStoryQuery(''); }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{story.title}</p>
                      {story.author && (
                        <p className="text-xs text-ink-400">作者：{story.author.username || story.author}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              disabled={!selectedStory}
              onClick={() => setStep('form')}
              className="w-full py-3 bg-accent-600 text-white rounded-xl font-black disabled:opacity-50 hover:bg-accent-700 transition-colors"
            >
              下一步
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-50 dark:bg-ink-700 border border-ink-100 dark:border-ink-600">
              <Calendar size={16} className="text-rose-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-700 dark:text-ink-300">{selectedStory?.title}</p>
              </div>
              <button onClick={() => setStep('story')} className="text-xs text-accent-600 hover:text-accent-700 font-bold">
                更换
              </button>
            </div>

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
              <button onClick={() => setStep('story')}
                className="flex-1 py-3 bg-ink-100 dark:bg-ink-700 rounded-xl font-bold hover:bg-ink-200 dark:hover:bg-ink-600 transition-colors">
                返回
              </button>
              <button onClick={handleCreate} disabled={isSubmitting || !title.trim()}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black disabled:opacity-50 hover:bg-rose-700 transition-colors">
                {isSubmitting ? '创建中...' : '创建事件'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CreateEventModal;
