import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Eye, Edit3, Save, Bold, Italic, Undo, Redo,
  SeparatorHorizontal, TextQuote, Lock, Unlock, AlertTriangle,
  Type, List, ListOrdered, Code, Strikethrough, Image,
  Circle, CheckCircle2, Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '../../stores/useAuthStore';
import { useMarkdownEditor } from '../../hooks/useMarkdownEditor';
import { useEditorLock } from '../../hooks/useEditorLock';
import { mediaService, type UploadedMedia } from '../../api/mediaService';

interface ChapterEditorProps {
  chapterId: string;
  storyId?: string;
  initialContent: string;
  onSave: (content: string) => void;
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({ chapterId, storyId, initialContent, onSave }) => {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [uploaded, setUploaded] = useState<UploadedMedia[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const { lockInfo, isLockedByOthers } = useEditorLock(chapterId, storyId);
  const { 
    textareaRef, 
    insertMarkdown, 
    applyHeading, 
    applyList, 
    applyQuote, 
    applyCode, 
    applyDivider 
  } = useMarkdownEditor(content, setContent);

  // 防抖自动保存（依赖 isLockedByOthers，必须在 useEditorLock 之后）
  const debouncedAutoSave = useCallback((currentContent: string) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (isLockedByOthers) return;
      setSaveStatus('saving');
      try {
        onSave(currentContent);
        setLastSavedContent(currentContent);
        setSaveStatus('saved');
        // 2 秒后恢复 idle
        setTimeout(() => setSaveStatus((s) => s === 'saved' ? 'idle' : s), 2000);
      } catch {
        setSaveStatus('error');
      }
    }, AUTO_SAVE_DELAY);
  }, [isLockedByOthers, onSave]);

  // 内容变化时触发自动保存
  useEffect(() => {
    if (!isDirty || content === initialContent) return;
    // 排除首次加载（content 尚未初始同步）
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

  useEffect(() => {
    // Word count calculation
    const text = content.replace(/<[^>]*>/g, '');
    setWordCount(text.length);
  }, [content]);

  const handleSave = () => {
    if (isLockedByOthers) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaveStatus('saving');
    onSave(content);
    setLastSavedContent(content);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus((s) => s === 'saved' ? 'idle' : s), 2000);
  };

  const handleUndo = () => {
    if (textareaRef.current) document.execCommand('undo');
  };

  const handleRedo = () => {
    if (textareaRef.current) document.execCommand('redo');
  };

  const handleUpload = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);
    try {
      const r = await mediaService.upload(file, 'chapter_inline');
      setUploaded((prev) => [r, ...prev].slice(0, 20));
      if (r.kind === 'image') {
        insertMarkdown(`![${file.name}](${r.resolvedUrl})`);
      } else {
        insertMarkdown(`[${r.kind}:${file.name}](${r.resolvedUrl})`);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '上传失败';
      setUploadError(String(msg));
    } finally {
      setIsUploading(false);
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title 
  }: { 
    onClick: () => void; 
    icon: React.ElementType; 
    title: string; 
  }) => (
    <button
      onClick={onClick}
      title={title}
      className="p-2 text-ink-500 hover:text-ink-600 hover:bg-ink-100 dark:text-ink-400 dark:hover:text-ink-200 dark:hover:bg-ink-700 rounded-lg transition-all"
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-700 rounded-3xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col border-b border-ink-100 dark:border-ink-700 bg-ink-50/50 dark:bg-ink-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              isLockedByOthers 
                ? 'bg-amber-100 text-amber-600 border border-amber-200' 
                : 'bg-accent-100 text-accent-500 border border-emerald-200'
            }`}>
              {isLockedByOthers ? <Lock size={12} /> : <Unlock size={12} />}
              {isLockedByOthers ? `持有者: ${lockInfo?.username}` : '可编辑'}
            </div>

            <div className="flex bg-ink-200 dark:bg-ink-700 rounded-xl p-1">
              <button
                onClick={() => setIsPreview(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  !isPreview ? 'bg-white dark:bg-ink-600 text-accent-500 shadow-sm' : 'text-ink-500 hover:text-ink-600'
                }`}
              >
                <Edit3 size={16} /> 编辑
              </button>
              <button
                onClick={() => setIsPreview(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  isPreview ? 'bg-white dark:bg-ink-600 text-accent-500 shadow-sm' : 'text-ink-500 hover:text-ink-600'
                }`}
              >
                <Eye size={16} /> 预览
              </button>
            </div>
            
            <div className="h-6 w-[1px] bg-ink-200 dark:bg-ink-600 mx-2"></div>
            
            <div className="flex items-center gap-1 text-ink-400">
              <Type size={16} />
              <span className="text-xs font-bold font-mono">{wordCount} 字</span>
            </div>

            {/* Auto-save status indicator */}
            {saveStatus !== 'idle' && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                saveStatus === 'saving' ? 'bg-accent-50 text-accent-500 dark:bg-accent-500/15 dark:text-accent-400' :
                saveStatus === 'saved' ? 'bg-accent-50 text-accent-500 dark:bg-accent-500/15 dark:text-accent-400' :
                'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {saveStatus === 'saving' && <Loader2 size={12} className="animate-spin" />}
                {saveStatus === 'saved' && <CheckCircle2 size={12} />}
                {saveStatus === 'error' && <Circle size={12} />}
                {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存' : '保存失败'}
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isLockedByOthers}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg active:scale-95 ${
              isLockedByOthers ? 'bg-ink-200 text-ink-400 cursor-not-allowed' : 'bg-accent-500 hover:bg-accent-600 text-white'
            }`}
          >
            <Save size={18} /> {isLockedByOthers ? '无法保存' : '保存章节'}
          </button>
        </div>

        {!isPreview && (
          <div className="flex items-center gap-1 px-6 py-2 border-t border-ink-100 dark:border-ink-700 overflow-x-auto">
            <div className="flex items-center gap-1 pr-2 border-r border-ink-200 dark:border-ink-600">
              <ToolbarButton onClick={handleUndo} icon={Undo} title="撤销 (Ctrl+Z)" />
              <ToolbarButton onClick={handleRedo} icon={Redo} title="重做 (Ctrl+Y)" />
            </div>

            <div className="flex items-center gap-1 px-2 border-r border-ink-200 dark:border-ink-600">
              <select
                onChange={(e) => {
                  const level = parseInt(e.target.value);
                  if (level > 0) applyHeading(level);
                  e.target.value = '';
                }}
                className="px-2 py-1 text-sm bg-transparent outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>标题</option>
                <option value="1">H1</option>
                <option value="2">H2</option>
                <option value="3">H3</option>
              </select>
            </div>

            <div className="flex items-center gap-1 px-2 border-r border-ink-200 dark:border-ink-600">
              <ToolbarButton onClick={() => insertMarkdown('**', '**')} icon={Bold} title="粗体" />
              <ToolbarButton onClick={() => insertMarkdown('*', '*')} icon={Italic} title="斜体" />
              <ToolbarButton onClick={() => insertMarkdown('~~', '~~')} icon={Strikethrough} title="删除线" />
            </div>

            <div className="flex items-center gap-1 px-2 border-r border-ink-200 dark:border-ink-600">
              <ToolbarButton onClick={() => applyList(false)} icon={List} title="无序列表" />
              <ToolbarButton onClick={() => applyList(true)} icon={ListOrdered} title="有序列表" />
            </div>

            <div className="flex items-center gap-1 px-2 border-r border-ink-200 dark:border-ink-600">
              <ToolbarButton onClick={applyQuote} icon={TextQuote} title="引用" />
              <ToolbarButton onClick={applyCode} icon={Code} title="代码" />
            </div>

            <div className="flex items-center gap-1 px-2">
              <ToolbarButton onClick={applyDivider} icon={SeparatorHorizontal} title="分隔线" />
            </div>

            <div className="flex items-center gap-1 pl-2 border-l border-ink-200 dark:border-ink-600">
              <label className={`p-2 text-ink-500 hover:text-ink-600 hover:bg-ink-100 dark:text-ink-400 dark:hover:text-ink-200 dark:hover:bg-ink-700 rounded-lg transition-all cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`} title="上传媒体">
                <Image size={18} />
                <input
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/webp,audio/mpeg,audio/wav,video/mp4"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) void handleUpload(f);
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {!isPreview && (uploadError || uploaded.length > 0) && (
          <div className="px-6 py-3 border-t border-ink-100 dark:border-ink-700 bg-ink-50 dark:bg-ink-800">
            {uploadError && (
              <div className="text-xs font-bold text-rose-600">{uploadError}</div>
            )}
            {uploaded.length > 0 && (
              <div className="mt-2 flex gap-3 overflow-x-auto">
                {uploaded.map((m) => (
                  <div key={m.id} className="shrink-0 w-40">
                    <div className="text-[10px] font-bold text-ink-500 truncate">{m.kind} · {m.mimeType}</div>
                    {m.kind === 'image' ? (
                      <img src={m.resolvedUrl} className="mt-1 w-40 h-24 object-cover rounded-xl border border-ink-100 dark:border-ink-700" />
                    ) : m.kind === 'audio' ? (
                      <audio className="mt-1 w-40" controls src={m.resolvedUrl} />
                    ) : (
                      <video className="mt-1 w-40 h-24 rounded-xl border border-ink-100 dark:border-ink-700" controls src={m.resolvedUrl} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative">
        {isLockedByOthers && (
          <div className="absolute inset-0 z-10 bg-white/40 dark:bg-ink-800/40 backdrop-blur-[2px] flex items-center justify-center p-8">
            <div className="bg-white dark:bg-ink-700 p-8 rounded-[2.5rem] shadow-2xl border border-ink-100 dark:border-ink-600 text-center space-y-4 max-w-sm">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-ink-800 dark:text-white">正在协作中</h3>
              <p className="text-sm text-ink-500 leading-relaxed">
                <span className="font-bold text-amber-600">@{lockInfo?.username}</span> 正在编辑此章节。
              </p>
              <button onClick={() => setIsPreview(true)} className="w-full py-3 bg-ink-100 hover:bg-ink-200 rounded-2xl font-bold">
                进入预览模式
              </button>
            </div>
          </div>
        )}
        {isPreview ? (
          <div className="h-full overflow-y-auto p-8 md:p-12 prose prose-lg dark:prose-invert max-w-none bg-ink-50 dark:bg-ink-800">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className="w-full h-full p-8 md:p-12 resize-none outline-none bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-200 text-lg leading-relaxed font-mono"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="开始你的故事创作... (支持 Markdown 语法)"
          />
        )}
      </div>
    </div>
  );
};

export default ChapterEditor;
