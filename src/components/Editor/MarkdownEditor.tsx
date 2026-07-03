import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye, Edit3, Bold, Italic, Undo, Redo,
  SeparatorHorizontal, TextQuote, Type, List, ListOrdered,
  Code, Strikethrough, Image, Link2, Table,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useMarkdownEditor } from '../../hooks/useMarkdownEditor';
import { mediaService, type UploadedMedia } from '../../api/mediaService';
import { Button, IconButton, Select } from '../ui';

interface MarkdownEditorProps {
  /** 受控内容 */
  value: string;
  /** 内容变化回调 */
  onChange: (value: string) => void;
  placeholder?: string;
  /** 只读：禁用编辑并强制预览（如被他人锁定时） */
  readOnly?: boolean;
  /** 是否显示媒体上传按钮 */
  enableMedia?: boolean;
  /** 媒体上传上下文，透传给 mediaService.upload */
  mediaContext?: string;
  /** 根容器类名，用于控制整体高度（如 'h-[520px]' 或 'h-full'） */
  className?: string;
  /** 左侧状态区插槽（字数之后）：锁状态 / 保存状态等 */
  statusSlot?: React.ReactNode;
  /** 右侧操作区插槽：保存按钮等 */
  actionsSlot?: React.ReactNode;
  /** 覆盖在编辑区之上的内容：锁定遮罩等 */
  overlay?: React.ReactNode;
  /** 受控预览态（可选）；不传则组件内部自管理 */
  preview?: boolean;
  onPreviewChange?: (preview: boolean) => void;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  disabled?: boolean;
}> = ({ onClick, icon: Icon, title, disabled = false }) => (
  <IconButton
    aria-label={title}
    title={title}
    onClick={onClick}
    disabled={disabled}
    variant="ghost"
    size="sm"
    className="text-ink-500 hover:text-ink-600 dark:text-ink-400 dark:hover:text-ink-200"
  >
    <Icon size={18} />
  </IconButton>
);

/**
 * MarkdownEditor — 纯 Markdown 编辑面（工具栏 + 编辑/预览 + 字数 + 媒体 + 历史 + 快捷键）。
 *
 * 无状态、可复用：不负责保存与协作锁，这些通过 statusSlot / actionsSlot / overlay /
 * readOnly 由上层（如 ChapterEditor）注入，故也可直接用于表单字段（如百科正文）。
 */
const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '从这里开始书写…\n\n支持 Markdown：# 标题、**加粗**、> 引用、- 列表，或用上方工具栏。',
  readOnly = false,
  enableMedia = false,
  mediaContext = 'chapter_inline',
  className = 'h-[520px]',
  statusSlot,
  actionsSlot,
  overlay,
  preview,
  onPreviewChange,
}) => {
  const [innerPreview, setInnerPreview] = useState(false);
  const isPreview = preview ?? innerPreview;
  const setIsPreview = useCallback((p: boolean) => {
    onPreviewChange?.(p);
    if (preview === undefined) setInnerPreview(p);
  }, [preview, onPreviewChange]);

  const [wordCount, setWordCount] = useState(0);
  const [uploaded, setUploaded] = useState<UploadedMedia[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    textareaRef,
    insertMarkdown,
    applyHeading,
    applyList,
    applyQuote,
    applyCode,
    applyDivider,
    applyLink,
    insertTable,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useMarkdownEditor(value, onChange);

  useEffect(() => {
    const text = value.replace(/<[^>]*>/g, '');
    setWordCount(text.length);
  }, [value]);

  // 被设为只读时强制退出编辑态
  useEffect(() => {
    if (readOnly) setIsPreview(true);
  }, [readOnly, setIsPreview]);

  const handleUpload = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);
    try {
      const r = await mediaService.upload(file, mediaContext);
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

  // 键盘快捷键：加粗 / 斜体 / 撤销 / 重做 / Tab 缩进
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod) {
      const key = e.key.toLowerCase();
      if (key === 'b') { e.preventDefault(); insertMarkdown('**', '**'); return; }
      if (key === 'i') { e.preventDefault(); insertMarkdown('*', '*'); return; }
      if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); redo(); return; }
      if (key === 'k') { e.preventDefault(); applyLink(); return; }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      insertMarkdown('  ');
    }
  };

  return (
    <div className={`flex flex-col ${className} bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-700 rounded-3xl overflow-hidden shadow-sm`}>
      {/* Header */}
      <div className="flex flex-col border-b border-ink-100 dark:border-ink-700 bg-ink-50/50 dark:bg-ink-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-ink-200 dark:bg-ink-700 rounded-xl p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreview(false)}
                disabled={readOnly}
                leftIcon={<Edit3 size={16} />}
                className={`gap-2 px-4 py-2 text-sm ${!isPreview ? 'bg-white dark:bg-ink-600 text-accent-500 shadow-sm' : 'text-ink-500 hover:text-ink-600'}`}
              >
                编辑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreview(true)}
                leftIcon={<Eye size={16} />}
                className={`gap-2 px-4 py-2 text-sm ${isPreview ? 'bg-white dark:bg-ink-600 text-accent-500 shadow-sm' : 'text-ink-500 hover:text-ink-600'}`}
              >
                预览
              </Button>
            </div>

            <div className="h-6 w-[1px] bg-ink-200 dark:bg-ink-600 mx-2" />

            <div className="flex items-center gap-1 text-ink-400">
              <Type size={16} />
              <span className="text-xs font-bold font-mono">{wordCount} 字</span>
            </div>

            {statusSlot}
          </div>

          {actionsSlot}
        </div>

        {!isPreview && !readOnly && (
          <div className="flex items-center gap-1 px-6 py-2 border-t border-ink-100 dark:border-ink-700 overflow-x-auto">
            <div className="flex items-center gap-1 pr-2 border-r border-ink-200 dark:border-ink-600">
              <ToolbarButton onClick={undo} icon={Undo} title="撤销 (Ctrl+Z)" disabled={!canUndo} />
              <ToolbarButton onClick={redo} icon={Redo} title="重做 (Ctrl+Y)" disabled={!canRedo} />
            </div>

            <div className="flex items-center gap-1 px-2 border-r border-ink-200 dark:border-ink-600">
              <Select
                size="sm"
                onChange={(e) => {
                  const level = parseInt(e.target.value);
                  if (level > 0) applyHeading(level);
                  e.target.value = '';
                }}
                defaultValue=""
                className="bg-transparent cursor-pointer"
                wrapperClassName="w-auto"
              >
                <option value="" disabled>标题</option>
                <option value="1">H1</option>
                <option value="2">H2</option>
                <option value="3">H3</option>
              </Select>
            </div>

            <div className="flex items-center gap-1 px-2 border-r border-ink-200 dark:border-ink-600">
              <ToolbarButton onClick={() => insertMarkdown('**', '**')} icon={Bold} title="粗体 (Ctrl+B)" />
              <ToolbarButton onClick={() => insertMarkdown('*', '*')} icon={Italic} title="斜体 (Ctrl+I)" />
              <ToolbarButton onClick={() => insertMarkdown('~~', '~~')} icon={Strikethrough} title="删除线" />
            </div>

            <div className="flex items-center gap-1 px-2 border-r border-ink-200 dark:border-ink-600">
              <ToolbarButton onClick={() => applyList(false)} icon={List} title="无序列表" />
              <ToolbarButton onClick={() => applyList(true)} icon={ListOrdered} title="有序列表" />
            </div>

            <div className="flex items-center gap-1 px-2 border-r border-ink-200 dark:border-ink-600">
              <ToolbarButton onClick={applyQuote} icon={TextQuote} title="引用" />
              <ToolbarButton onClick={applyCode} icon={Code} title="代码" />
              <ToolbarButton onClick={applyLink} icon={Link2} title="链接 (Ctrl+K)" />
            </div>

            <div className="flex items-center gap-1 px-2">
              <ToolbarButton onClick={applyDivider} icon={SeparatorHorizontal} title="分隔线" />
              <ToolbarButton onClick={insertTable} icon={Table} title="表格" />
            </div>

            {enableMedia && (
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
            )}
          </div>
        )}

        {enableMedia && !isPreview && !readOnly && (uploadError || uploaded.length > 0) && (
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

      {/* Editing / preview surface */}
      <div className="flex-1 overflow-hidden relative">
        {overlay}
        {isPreview ? (
          <div className="h-full overflow-y-auto p-8 md:p-12 md-prose prose prose-lg dark:prose-invert max-w-none bg-ink-50 dark:bg-ink-800">
            {value.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-ink-400 italic">暂无内容，切换到「编辑」开始创作。</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className="w-full h-full p-8 md:p-12 resize-none outline-none bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-200 text-lg leading-relaxed font-mono"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
