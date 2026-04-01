import { useRef, useCallback } from 'react';

export const useMarkdownEditor = (content: string, setContent: (content: string) => void) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = useCallback((before: string, after: string = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    const newCursorPos = start + before.length + selectedText.length;
    
    setContent(newText);
    
    // 恢复焦点和光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [setContent]);

  const applyHeading = useCallback((level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const text = textarea.value;
    
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = text.indexOf('\n', start);
    const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
    
    const currentLine = text.substring(lineStart, actualLineEnd);
    const cleanLine = currentLine.replace(/^#+\s*/, '');
    const newLine = prefix + cleanLine;
    
    const newText = text.substring(0, lineStart) + newLine + text.substring(actualLineEnd);
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = lineStart + newLine.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [setContent]);

  const applyList = useCallback((ordered: boolean) => {
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
  }, [setContent]);

  const applyQuote = useCallback(() => {
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
  }, [setContent]);

  const applyCode = useCallback(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    if (selectedText.includes('\n')) {
      const newText = text.substring(0, start) + '\n```\n' + selectedText + '\n```\n' + text.substring(end);
      setContent(newText);
      setTimeout(() => {
        textarea.focus();
        const newPos = start + 4 + selectedText.length + 4;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      insertMarkdown('`', '`');
    }
  }, [setContent, insertMarkdown]);

  const applyDivider = useCallback(() => {
    insertMarkdown('\n\n---\n\n');
  }, [insertMarkdown]);

  return {
    textareaRef,
    insertMarkdown,
    applyHeading,
    applyList,
    applyQuote,
    applyCode,
    applyDivider
  };
};
