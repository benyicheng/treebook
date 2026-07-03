import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Save, Lock, Unlock, AlertTriangle,
  Circle, CheckCircle2, Loader2, Radio, Clock, Hand,
} from 'lucide-react';
import { useEditorLock } from '../../hooks/useEditorLock';
import { Button } from '../ui';
import MarkdownEditor from './MarkdownEditor';

interface ChapterEditorProps {
  chapterId: string;
  storyId?: string;
  initialContent: string;
  /**
   * 保存回调。`meta.auto` 为 true 表示后台自动保存（应静默持久化，不要提示或跳转），
   * false / 省略表示用户点击「保存」的显式保存（可提示成功并返回列表）。
   */
  onSave: (content: string, meta?: { auto?: boolean }) => void | Promise<void>;
}

/** 把锁获取时间格式化为「编辑时长」提示 */
function formatEditingSince(acquiredAt: number | undefined, now: number): string | null {
  if (!acquiredAt) return null;
  const mins = Math.floor((now - acquiredAt) / 60000);
  if (mins < 1) return '刚刚开始';
  if (mins < 60) return `已编辑 ${mins} 分钟`;
  return `已编辑 ${Math.floor(mins / 60)} 小时`;
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({ chapterId, storyId, initialContent, onSave }) => {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);

  // --- Auto-Save State ---
  const AUTO_SAVE_DELAY = 3000; // 3 秒防抖
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedContent, setLastSavedContent] = useState(initialContent);
  const isDirty = content !== lastSavedContent;

  // 章节切换时重置内容
  useEffect(() => {
    setContent(initialContent);
    setLastSavedContent(initialContent);
    setSaveStatus('idle');
  }, [chapterId]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  const {
    lockInfo,
    isLockedByOthers,
    remoteContent,
    broadcastContent,
    requestTakeover,
    takeoverRequestedBy,
    clearTakeoverRequest,
  } = useEditorLock(chapterId, storyId);

  const [takeoverSent, setTakeoverSent] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());

  // 被他人锁定时，定时刷新以更新「编辑时长」
  useEffect(() => {
    if (!isLockedByOthers) return;
    const t = setInterval(() => setNowTs(Date.now()), 30000);
    return () => clearInterval(t);
  }, [isLockedByOthers]);

  // 锁状态切换时重置接管请求本地态
  useEffect(() => { if (!isLockedByOthers) setTakeoverSent(false); }, [isLockedByOthers]);

  // 持有者：内容变化后节流广播给只读浏览者（实时镜像）
  const broadcastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isLockedByOthers) return; // 只有持有者广播
    if (broadcastTimer.current) clearTimeout(broadcastTimer.current);
    broadcastTimer.current = setTimeout(() => broadcastContent(content), 500);
    return () => { if (broadcastTimer.current) clearTimeout(broadcastTimer.current); };
  }, [content, isLockedByOthers, broadcastContent]);

  // 防抖自动保存（依赖 isLockedByOthers，必须在 useEditorLock 之后）
  const debouncedAutoSave = useCallback((currentContent: string) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (isLockedByOthers) return;
      setSaveStatus('saving');
      try {
        await Promise.resolve(onSave(currentContent, { auto: true }));
        setLastSavedContent(currentContent);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus((s) => s === 'saved' ? 'idle' : s), 2000);
      } catch {
        setSaveStatus('error');
      }
    }, AUTO_SAVE_DELAY);
  }, [isLockedByOthers, onSave]);

  // 内容变化时触发自动保存
  useEffect(() => {
    if (!isDirty || content === initialContent) return;
    if (lastSavedContent === initialContent && content === initialContent) return;
    debouncedAutoSave(content);
  }, [content, isDirty, lastSavedContent, initialContent, debouncedAutoSave]);

  // beforeunload 防护：有未保存更改时提示
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSave = async () => {
    if (isLockedByOthers) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaveStatus('saving');
    try {
      await Promise.resolve(onSave(content, { auto: false }));
      setLastSavedContent(content);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus((s) => s === 'saved' ? 'idle' : s), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleRequestTakeover = () => {
    requestTakeover();
    setTakeoverSent(true);
  };

  // 只读浏览者展示持有者的实时内容；自己编辑时展示本地内容
  const displayValue = isLockedByOthers && remoteContent != null ? remoteContent : content;
  const editingSince = formatEditingSince(lockInfo?.acquiredAt, nowTs);

  const statusSlot = (
    <>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
        isLockedByOthers
          ? 'bg-amber-100 text-amber-600 border border-amber-200'
          : 'bg-accent-100 text-accent-500 border border-emerald-200'
      }`}>
        {isLockedByOthers ? <Lock size={12} /> : <Unlock size={12} />}
        {isLockedByOthers ? `持有者: ${lockInfo?.username}` : '可编辑'}
      </div>

      {/* 只读浏览者：实时同步指示 */}
      {isLockedByOthers && remoteContent != null && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <Radio size={12} className="animate-pulse" /> 实时同步中
        </div>
      )}

      {/* 只读浏览者：编辑时长 */}
      {isLockedByOthers && editingSince && (
        <div className="flex items-center gap-1 text-xs font-bold text-ink-400">
          <Clock size={12} /> {editingSince}
        </div>
      )}

      {/* 持有者：收到接管请求 */}
      {!isLockedByOthers && takeoverRequestedBy && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearTakeoverRequest}
          title="点击忽略"
          className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 hover:bg-amber-100 hover:opacity-80 px-2.5 py-1 rounded-full text-xs"
        >
          <Hand size={12} /> {takeoverRequestedBy} 想接管，完成后请退出
        </Button>
      )}

      {/* 保存状态 */}
      {saveStatus !== 'idle' && (
        saveStatus === 'error' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSave}
            title="点击重试保存"
            className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 px-2.5 py-1 rounded-full text-xs"
          >
            <Circle size={12} /> 保存失败 · 点击重试
          </Button>
        ) : (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            'bg-accent-50 text-accent-500 dark:bg-accent-500/15 dark:text-accent-400'
          }`}>
            {saveStatus === 'saving' && <Loader2 size={12} className="animate-spin" />}
            {saveStatus === 'saved' && <CheckCircle2 size={12} />}
            {saveStatus === 'saving' ? '保存中...' : '已保存'}
          </div>
        )
      )}
    </>
  );

  const actionsSlot = (
    <Button
      type="button"
      onClick={handleSave}
      disabled={isLockedByOthers}
      leftIcon={<Save size={18} />}
      className={`px-6 py-2.5 text-sm shadow-lg ${
        isLockedByOthers ? 'bg-ink-200 text-ink-400 cursor-not-allowed hover:bg-ink-200' : ''
      }`}
    >
      {isLockedByOthers ? '无法保存' : '保存章节'}
    </Button>
  );

  const overlay = isLockedByOthers ? (
    <div className="absolute inset-0 z-10 bg-white/40 dark:bg-ink-800/40 backdrop-blur-[2px] flex items-center justify-center p-8">
      <div className="bg-white dark:bg-ink-700 p-8 rounded-[2.5rem] shadow-2xl border border-ink-100 dark:border-ink-600 text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-black text-ink-800 dark:text-white">正在协作中</h3>
        <p className="text-sm text-ink-500 leading-relaxed">
          <span className="font-bold text-amber-600">@{lockInfo?.username}</span> 正在编辑此章节
          {remoteContent != null && <span className="block mt-1 text-emerald-600 font-bold">内容正在实时同步，可切换预览查看</span>}
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="subtle" fullWidth onClick={() => setIsPreview(true)} className="w-full py-3 rounded-2xl">
            进入预览模式
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={handleRequestTakeover}
            disabled={takeoverSent}
            className="w-full py-3 rounded-2xl text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 disabled:opacity-60 disabled:cursor-default"
          >
            {takeoverSent ? '已通知当前编辑者' : '请求接管编辑'}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <MarkdownEditor
      value={displayValue}
      onChange={setContent}
      readOnly={isLockedByOthers}
      enableMedia
      mediaContext="chapter_inline"
      className="h-[calc(100vh-200px)]"
      placeholder={'从这里开始书写你的故事…\n\n支持 Markdown：# 标题、**加粗**、> 引用、- 列表，或用上方工具栏。'}
      statusSlot={statusSlot}
      actionsSlot={actionsSlot}
      overlay={overlay}
      preview={isPreview}
      onPreviewChange={setIsPreview}
    />
  );
};

export default ChapterEditor;
