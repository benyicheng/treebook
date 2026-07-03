import { useState, useCallback, useEffect, useRef } from 'react';
import { wikiService, WikiLookupResult } from '../../../api/wikiService';

export interface SelectionRect {
  top: number;
  left: number;
  width: number;
  height: number;
  /** 选区底边 y 坐标（top + height） */
  bottom: number;
}

export const useWikiLookup = () => {
  const [selectedText, setSelectedText] = useState('');
  const [results, setResults] = useState<WikiLookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  /** 选区的 bounding rect，供浮动工具条定位 */
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  /** 是否已弹出工具条（选中文本且未查询时为 true，查询/关闭后为 false） */
  const [showToolbar, setShowToolbar] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const close = useCallback(() => {
    setShowToolbar(false);
    setShowPopover(false);
    setSelectedText('');
    setResults([]);
  }, []);

  const handleTextSelect = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection();
    // 点击空白处取消时，收起工具条
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setShowToolbar(false);
      setShowPopover(false);
      return;
    }
    const text = selection.toString().trim();
    if (text.length < 2) {
      setShowToolbar(false);
      return;
    }

    // 用选区的 bounding rect 定位工具条（而非鼠标坐标，更稳定）
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectionRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
    });
    setSelectedText(text);
    setShowToolbar(true);
    setShowPopover(false);
    setResults([]);
  }, []);

  /** 用户点击工具条"查百科"后触发查询 */
  const lookupSelected = useCallback(async () => {
    if (!selectedText) return;
    setShowToolbar(false);
    setShowPopover(true);
    setLoading(true);
    try {
      const data = await wikiService.lookup(selectedText, 3);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedText]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    selectedText,
    results,
    loading,
    selectionRect,
    showToolbar,
    showPopover,
    handleTextSelect,
    lookupSelected,
    close,
  };
};