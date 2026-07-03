import { useRef, useCallback, useEffect, useLayoutEffect, useState } from 'react';

/** 历史栈上限，避免长时间编辑内存无限增长 */
const HISTORY_LIMIT = 200;
/** 连续输入的快照防抖窗口（毫秒） */
const SNAPSHOT_DEBOUNCE = 400;

export const useMarkdownEditor = (content: string, setContent: (content: string) => void) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 始终指向最新 content，供定时器/回调内读取（避免闭包读到旧值）
  const contentRef = useRef(content);
  contentRef.current = content;

  // ── 撤销/重做历史栈 ──────────────────────────────────────────────
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const lastRecorded = useRef(content); // 已入栈的基线内容
  const burstBase = useRef(content);     // 当前一连串输入前的基线
  const isApplyingHistory = useRef(false); // 正在应用 undo/redo，避免自我记录
  const snapshotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // 待恢复的选区：内容更新渲染后统一应用，替代脆弱的 setTimeout(0)。
  // 存 { start, end }，start===end 时即为普通光标。
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);

  useLayoutEffect(() => {
    if (pendingSelection.current != null && textareaRef.current) {
      const { start, end } = pendingSelection.current;
      pendingSelection.current = null;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
    }
  });

  // 将挂起的快照立即落栈（在执行 undo/redo 前先固化当前输入）
  const flushSnapshot = useCallback(() => {
    if (!snapshotTimer.current) return;
    clearTimeout(snapshotTimer.current);
    snapshotTimer.current = null;
    if (burstBase.current !== contentRef.current) {
      undoStack.current.push(burstBase.current);
      if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
    }
    lastRecorded.current = contentRef.current;
  }, []);

  // 监听内容变化，防抖记录历史
  useEffect(() => {
    if (isApplyingHistory.current) {
      isApplyingHistory.current = false;
      lastRecorded.current = content;
      return;
    }
    if (content === lastRecorded.current) return;

    // 新一轮输入起点：记录本轮基线
    if (!snapshotTimer.current) {
      burstBase.current = lastRecorded.current;
    }
    if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
    snapshotTimer.current = setTimeout(() => {
      snapshotTimer.current = null;
      if (burstBase.current !== contentRef.current) {
        undoStack.current.push(burstBase.current);
        if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
        redoStack.current = [];
        setCanUndo(true);
        setCanRedo(false);
      }
      lastRecorded.current = contentRef.current;
    }, SNAPSHOT_DEBOUNCE);
  }, [content]);

  // 卸载清理定时器
  useEffect(() => () => {
    if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
  }, []);

  const undo = useCallback(() => {
    flushSnapshot();
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    redoStack.current.push(contentRef.current);
    isApplyingHistory.current = true;
    lastRecorded.current = prev;
    setContent(prev);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
  }, [flushSnapshot, setContent]);

  const redo = useCallback(() => {
    flushSnapshot();
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(contentRef.current);
    isApplyingHistory.current = true;
    lastRecorded.current = next;
    setContent(next);
    setCanRedo(redoStack.current.length > 0);
    setCanUndo(true);
  }, [flushSnapshot, setContent]);

  // ── Markdown 语法工具 ────────────────────────────────────────────

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
    pendingSelection.current = { start: newCursorPos, end: newCursorPos };
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
    pendingSelection.current = { start: lineStart + newLine.length, end: lineStart + newLine.length };
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

    const joined = formattedLines.join('\n');
    const newText = text.substring(0, start) + joined + text.substring(end);
    setContent(newText);
    pendingSelection.current = { start: start + joined.length, end: start + joined.length };
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

    const joined = formattedLines.join('\n');
    const newText = text.substring(0, start) + joined + text.substring(end);
    setContent(newText);
    pendingSelection.current = { start: start + joined.length, end: start + joined.length };
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
      pendingSelection.current = { start: start + 4 + selectedText.length + 4, end: start + 4 + selectedText.length + 4 };
    } else {
      insertMarkdown('`', '`');
    }
  }, [setContent, insertMarkdown]);

  const applyDivider = useCallback(() => {
    insertMarkdown('\n\n---\n\n');
  }, [insertMarkdown]);

  // 插入链接：有选中文本则作为链接文字，光标选中占位 URL 方便替换
  const applyLink = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const label = text.substring(start, end) || '链接文字';
    const url = 'https://';
    const inserted = `[${label}](${url})`;
    const newText = text.substring(0, start) + inserted + text.substring(end);
    setContent(newText);
    // 选中 URL 部分：位置 = start + '[' + label + '](' 之后，到 url 结尾
    const urlStart = start + 1 + label.length + 2;
    pendingSelection.current = { start: urlStart, end: urlStart + url.length };
  }, [setContent]);

  // 插入表格骨架
  const insertTable = useCallback(() => {
    const table = '\n| 列 1 | 列 2 | 列 3 |\n| --- | --- | --- |\n| 单元格 | 单元格 | 单元格 |\n';
    insertMarkdown(table);
  }, [insertMarkdown]);

  return {
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
  };
};
