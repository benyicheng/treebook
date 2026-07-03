import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Library, Calendar, GitBranch, Sparkles, FileText,
  Check, Search, type LucideIcon,
} from 'lucide-react';
import { Modal, DebouncedInput, EmptyState, Button, Textarea } from '../../../components/ui';
import { chapterService, storyService, branchService, spinoffService } from '../../../api/storyService';
import { storyEventService } from '../../../api/storyEventService';
import { wikiService } from '../../../api/wikiService';

export type AddItemType = 'chapter' | 'story' | 'branch' | 'spinoff' | 'event' | 'wiki';

interface AddItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** 各类型已存在的 targetId 集合，用于标记"已添加" */
  existingIds: Record<AddItemType, Set<string>>;
  /** 批量提交回调，返回 { added, skipped } 统计 */
  onSubmit: (items: { targetType: AddItemType; targetId: string }[], notes: string) => Promise<void>;
  /** 打开"创建大事件"子流程 */
  onOpenCreateEvent?: () => void;
  /** 默认选中的标签页 */
  defaultTab?: AddItemType;
}

interface TabConfig {
  id: AddItemType;
  label: string;
  icon: LucideIcon;
  color: string;
  placeholder: string;
}

const TABS: TabConfig[] = [
  { id: 'chapter', label: '章节', icon: BookOpen,   color: 'blue',    placeholder: '搜索章节标题...' },
  { id: 'story',   label: '故事', icon: Library,    color: 'indigo',  placeholder: '搜索故事标题...' },
  { id: 'branch',  label: '分支', icon: GitBranch,  color: 'emerald', placeholder: '搜索分支标题...' },
  { id: 'spinoff', label: '番外', icon: Sparkles,   color: 'purple',  placeholder: '搜索番外标题...' },
  { id: 'event',   label: '事件', icon: Calendar,   color: 'rose',    placeholder: '搜索大事件...' },
  { id: 'wiki',    label: '百科', icon: FileText,   color: 'amber',   placeholder: '搜索百科词条...' },
];

const COLOR_MAP: Record<string, { selected: string; icon: string }> = {
  blue:    { selected: 'border-blue-300 bg-blue-50 dark:bg-blue-900/20',    icon: 'bg-blue-500' },
  indigo:  { selected: 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20', icon: 'bg-indigo-500' },
  emerald: { selected: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20', icon: 'bg-emerald-500' },
  purple:  { selected: 'border-purple-300 bg-purple-50 dark:bg-purple-900/20', icon: 'bg-purple-500' },
  rose:    { selected: 'border-rose-300 bg-rose-50 dark:bg-rose-900/20',    icon: 'bg-rose-500' },
  amber:   { selected: 'border-amber-300 bg-amber-50 dark:bg-amber-900/20', icon: 'bg-amber-500' },
};

/**
 * 统一的"添加内容到书单"抽屉。
 * 左侧 Tab 切换 6 种内容类型，右侧搜索 + 勾选，底部统一点评 + 批量提交。
 * 替换原 BooklistDetailPage 中 6 个重复的 SearchableSelectionModal。
 */
const AddItemDrawer: React.FC<AddItemDrawerProps> = ({
  isOpen, onClose, existingIds, onSubmit, onOpenCreateEvent, defaultTab = 'chapter',
}) => {
  const [activeTab, setActiveTab] = useState<AddItemType>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 统一搜索查询：根据当前 Tab 调用对应 service
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['add-item-search', activeTab, searchQuery],
    queryFn: async () => {
      const q = searchQuery.trim();
      if (!q) return [];
      switch (activeTab) {
        case 'chapter': return chapterService.search(q);
        case 'story':   return storyService.getAll({ q });
        case 'branch':  return branchService.getAll({ q });
        case 'spinoff': return spinoffService.getAll({ q });
        case 'event':   return storyEventService.search(q);
        case 'wiki':    return wikiService.list({ search: q, limit: '999' }).then(r => r.items || []);
        default: return [];
      }
    },
    enabled: searchQuery.trim().length > 0,
  });

  // 统一提取 item 的 { id, primary, secondary, badge }
  const normalizedResults = useMemo(() => {
    return (results as any[]).map(item => {
      switch (activeTab) {
        case 'chapter':
          return { id: item.id, primary: item.title || `第${item.orderIndex}章`, secondary: item.story?.title, badge: '' };
        case 'story':
          return { id: item.id, primary: item.title, secondary: item.author?.username || item.author, badge: '' };
        case 'branch':
          return { id: item.id, primary: item.title, secondary: item.parentStory?.title ? `源自：${item.parentStory.title}` : '', badge: item.branchType };
        case 'spinoff':
          return { id: item.id, primary: item.title, secondary: item.originalStory?.title ? `出自：${item.originalStory.title}` : '', badge: item.type };
        case 'event':
          return { id: item.id, primary: item.title, secondary: item.description, badge: item.type };
        case 'wiki':
          return { id: item.id, primary: item.title, secondary: item.summary, badge: item.contentType };
        default:
          return { id: item.id, primary: '', secondary: '', badge: '' };
      }
    });
  }, [results, activeTab]);

  const existing = existingIds[activeTab] || new Set<string>();

  const toggleSelection = (id: string) => {
    if (existing.has(id)) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const available = normalizedResults.filter(r => !existing.has(r.id));
    if (available.length === 0) return;
    const allSelected = available.every(r => selectedIds.has(r.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        available.forEach(r => next.delete(r.id));
      } else {
        available.forEach(r => next.add(r.id));
      }
      return next;
    });
  };

  const handleClose = () => {
    onClose();
    // 延迟重置，避免关闭动画闪烁
    setTimeout(() => {
      setSearchQuery('');
      setSelectedIds(new Set());
      setNotes('');
      setActiveTab('chapter');
    }, 200);
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    try {
      const items = Array.from(selectedIds).map(targetId => ({ targetType: activeTab, targetId }));
      await onSubmit(items, notes);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const tc = TABS.find(t => t.id === activeTab)!;
  const colors = COLOR_MAP[tc.color];
  const availableResults = normalizedResults.filter(r => !existing.has(r.id));
  const allAvailableSelected = availableResults.length > 0 && availableResults.every(r => selectedIds.has(r.id));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="添加到书单" size="xl">
      <div className="flex gap-6">
        {/* 左侧：类型 Tab */}
        <div className="hidden sm:flex flex-col gap-1 w-36 shrink-0 border-r border-ink-100 dark:border-ink-600 pr-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                size="md"
                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); setSelectedIds(new Set()); }}
                leftIcon={<Icon size={16} />}
                className="flex-none justify-start text-left"
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* 移动端横向 Tab */}
        <div className="sm:hidden flex gap-1 overflow-x-auto pb-2 -mt-2 w-full">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'subtle'}
                size="sm"
                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); setSelectedIds(new Set()); }}
                leftIcon={<Icon size={14} />}
                className="flex-none whitespace-nowrap"
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* 右侧：搜索 + 列表 */}
        <div className="flex-1 min-w-0 space-y-4">
          <DebouncedInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={tc.placeholder}
            autoFocus
          />

          {/* 结果区 */}
          <div className="min-h-[300px] max-h-[420px] overflow-y-auto">
            {searchQuery.trim().length === 0 ? (
              <EmptyState icon={Search} title={`输入关键词搜索${tc.label}`} compact />
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-500 border-t-transparent" />
              </div>
            ) : normalizedResults.length === 0 ? (
              <EmptyState
                icon={tc.icon}
                title={`未找到匹配的${tc.label}`}
                compact
                action={activeTab === 'event' && onOpenCreateEvent ? {
                  label: '创建新大事件',
                  onClick: () => { onOpenCreateEvent(); handleClose(); },
                } : undefined}
              />
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-ink-400">{selectedIds.size} 个已选</span>
                  {availableResults.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={toggleAll} className="text-accent-600 hover:text-accent-700 h-auto py-0">
                      {allAvailableSelected ? '取消全选' : '全选'}
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {normalizedResults.map(r => {
                    const alreadyExists = existing.has(r.id);
                    const selected = selectedIds.has(r.id);
                    return (
                      <div
                        key={r.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                          selected ? colors.selected : 'border-ink-100 hover:bg-ink-50 dark:hover:bg-ink-600/50'
                        } ${alreadyExists ? 'opacity-50' : 'cursor-pointer'}`}
                        onClick={() => toggleSelection(r.id)}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                          selected ? `${colors.icon} border-transparent` : 'border-ink-300'
                        }`}>
                          {selected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-ink-800 dark:text-white">{r.primary}</p>
                          {r.secondary && <p className="text-xs text-ink-400 truncate mt-0.5">{r.secondary}</p>}
                        </div>
                        {r.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ink-100 dark:bg-ink-600 text-ink-500 font-medium shrink-0">
                            {r.badge}
                          </span>
                        )}
                        {alreadyExists && <span className="text-[10px] text-ink-400 shrink-0">已添加</span>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 底部：统一点评 + 提交 */}
          {selectedIds.size > 0 && (
            <div className="space-y-3 border-t border-ink-100 dark:border-ink-600 pt-4">
              <Textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="批量添加导游点评（可选，应用到所有选中项）"
                className="resize-none text-sm"
              />
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleSubmit}
                disabled={isSubmitting}
                loading={isSubmitting}
                className="py-3 bg-accent-600 hover:bg-accent-700"
              >
                {isSubmitting ? '添加中...' : `添加 ${selectedIds.size} 个${tc.label}`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddItemDrawer;
