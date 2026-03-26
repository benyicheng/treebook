import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../stores/useAuthStore';
import ReactMarkdown from 'react-markdown';
import { 
  Eye, Edit3, Save, Bold, Italic, Heading1, Heading2, Quote, 
  List, ListOrdered, Type, AlignLeft, AlignCenter, AlignRight,
  Underline, Strikethrough, Code, Link, Image, Undo, Redo,
  SeparatorHorizontal, TextQuote
} from 'lucide-react';

interface ChapterEditorProps {
  chapterId: string;
  initialContent: string;
  onSave: (content: string) => void;
}

// 格式化工具函数
const insertMarkdown = (textarea: HTMLTextAreaElement, before: string, after: string = '') => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);
  
  const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
  
  // 返回新内容和新的光标位置
  const newCursorPos = start + before.length + selectedText.length;
  return { newText, newCursorPos };
};

const ChapterEditor: React.FC<ChapterEditorProps> = ({ chapterId, initialContent, onSave }) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Calculate word count (simple approximation for Chinese/English)
    const text = content.replace(/<[^>]*>/g, '');
    setWordCount(text.length);
  }, [content]);

  const handleSave = () => {
    onSave(content);
  };

  // 格式化工具函数
  const applyFormat = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const { newText, newCursorPos } = insertMarkdown(textarea, before, after);
    
    setContent(newText);
    
    // 恢复焦点和光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 标题格式化
  const applyHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const text = textarea.value;
    
    // 找到当前行的起始位置
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = text.indexOf('\n', start);
    const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
    
    const currentLine = text.substring(lineStart, actualLineEnd);
    // 移除已有的标题标记
    const cleanLine = currentLine.replace(/^#+\s*/, '');
    const newLine = prefix + cleanLine;
    
    const newText = text.substring(0, lineStart) + newLine + text.substring(actualLineEnd);
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = lineStart + newLine.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // 列表格式化
  const applyList = (ordered: boolean) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const selectedText = text.substring(start, end);
    const lines = selectedText.split('\n');
    const formattedLines = lines.map((line, index) => {
      const cleanLine = line.replace(/^[-*+\d.]\s*/, '');
      return ordered ? `${index + 1}. ${cleanLine}` : `- ${cleanLine}`;
    });
    
    const newText = text.substring(0, start) + formattedLines.join('\n') + text.substring(end);
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + formattedLines.join('\n').length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // 引用块格式化
  const applyQuote = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const selectedText = text.substring(start, end);
    const lines = selectedText.split('\n');
    const formattedLines = lines.map(line => {
      const cleanLine = line.replace(/^>\s*/, '');
      return `> ${cleanLine}`;
    });
    
    const newText = text.substring(0, start) + formattedLines.join('\n') + text.substring(end);
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + formattedLines.join('\n').length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // 代码块格式化
  const applyCode = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    // 如果选中了多行，使用代码块
    if (selectedText.includes('\n')) {
      const newText = text.substring(0, start) + '\n```\n' + selectedText + '\n```\n' + text.substring(end);
      setContent(newText);
      setTimeout(() => {
        textarea.focus();
        const newPos = start + 4 + selectedText.length + 4;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      // 单行使用行内代码
      applyFormat('`', '`');
    }
  };

  // 分隔线
  const applyDivider = () => {
    applyFormat('\n\n---\n\n');
  };

  // 撤销/重做（使用浏览器原生功能）
  const handleUndo = () => {
    if (textareaRef.current) {
      document.execCommand('undo');
    }
  };

  const handleRedo = () => {
    if (textareaRef.current) {
      document.execCommand('redo');
    }
  };

  // 工具栏按钮组件
  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title, 
    active = false 
  }: { 
    onClick: () => void; 
    icon: React.ElementType; 
    title: string; 
    active?: boolean;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-all ${
        active 
          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
      }`}
    >
      <Icon size={18} />
    </button>
  );

  // 下拉选择组件
  const HeadingSelect = () => (
    <select
      onChange={(e) => {
        const level = parseInt(e.target.value);
        if (level > 0) applyHeading(level);
        e.target.value = '';
      }}
      className="px-3 py-2 text-sm font-medium text-gray-600 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      defaultValue=""
    >
      <option value="" disabled>标题</option>
      <option value="1">H1 大标题</option>
      <option value="2">H2 中标题</option>
      <option value="3">H3 小标题</option>
      <option value="4">H4 副标题</option>
    </select>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
        {/* 第一行：模式切换和保存 */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-200 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setIsPreview(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  !isPreview 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Edit3 size={16} />
                编辑
              </button>
              <button
                onClick={() => setIsPreview(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  isPreview 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Eye size={16} />
                预览
              </button>
            </div>
            
            <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>
            
            <div className="flex items-center gap-1 text-gray-400">
              <Type size={16} />
              <span className="text-xs font-bold font-mono">{wordCount} 字</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Save size={18} />
            保存章节
          </button>
        </div>

        {/* 第二行：格式化工具栏 */}
        {!isPreview && (
          <div className="flex items-center gap-1 px-6 py-2 border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
            {/* 撤销/重做 */}
            <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-gray-700">
              <ToolbarButton onClick={handleUndo} icon={Undo} title="撤销 (Ctrl+Z)" />
              <ToolbarButton onClick={handleRedo} icon={Redo} title="重做 (Ctrl+Y)" />
            </div>

            {/* 标题 */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-gray-700">
              <HeadingSelect />
            </div>

            {/* 文本样式 */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-gray-700">
              <ToolbarButton onClick={() => applyFormat('**', '**')} icon={Bold} title="粗体 (Ctrl+B)" />
              <ToolbarButton onClick={() => applyFormat('*', '*')} icon={Italic} title="斜体 (Ctrl+I)" />
              <ToolbarButton onClick={() => applyFormat('~~', '~~')} icon={Strikethrough} title="删除线" />
              <ToolbarButton onClick={() => applyFormat('<u>', '</u>')} icon={Underline} title="下划线" />
            </div>

            {/* 列表 */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-gray-700">
              <ToolbarButton onClick={() => applyList(false)} icon={List} title="无序列表" />
              <ToolbarButton onClick={() => applyList(true)} icon={ListOrdered} title="有序列表" />
            </div>

            {/* 引用和代码 */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-gray-700">
              <ToolbarButton onClick={applyQuote} icon={TextQuote} title="引用" />
              <ToolbarButton onClick={applyCode} icon={Code} title="代码" />
            </div>

            {/* 分隔线 */}
            <div className="flex items-center gap-1 px-2">
              <ToolbarButton onClick={applyDivider} icon={SeparatorHorizontal} title="分隔线" />
            </div>
          </div>
        )}
      </div>

      {/* Editor / Preview Area */}
      <div className="flex-1 overflow-hidden relative">
        {isPreview ? (
          <div className="h-full overflow-y-auto p-8 md:p-12 prose prose-lg dark:prose-invert max-w-none bg-white dark:bg-gray-900 leading-relaxed">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className="w-full h-full p-8 md:p-12 resize-none outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-lg leading-relaxed font-mono"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="开始你的故事创作... (支持 Markdown 语法)

快捷键：
- Ctrl+B 粗体
- Ctrl+I 斜体
- 选中文字后点击工具栏按钮可快速格式化"
          />
        )}
      </div>
    </div>
  );
};

export default ChapterEditor;
