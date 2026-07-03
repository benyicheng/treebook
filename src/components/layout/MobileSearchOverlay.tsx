import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import searchService, { type SearchSuggestItem } from '../../api/searchService';
import { IconButton, Button } from '../ui';

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEARCH_HISTORY_KEY = 'mobile_search_history';
const MAX_HISTORY = 8;

function getItemLink(item: SearchSuggestItem): string {
  switch (item.type) {
    case 'story': return `/story/${item.sourceId}`;
    case 'chapter': return `/read/${item.sourceId}`;
    case 'branch': return `/branch/${item.sourceId}`;
    case 'spinoff': return `/spinoff/${item.sourceId}`;
    case 'author': return `/profile/${item.sourceId}`;
    default: return '/';
  }
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    story: '故事',
    chapter: '章节',
    branch: '分支',
    spinoff: '番外',
    author: '作者',
  };
  return labels[type] || type;
}

export const MobileSearchOverlay: React.FC<MobileSearchOverlayProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const items = await searchService.searchSuggest(searchQuery.trim(), 6);
        setSuggestions(items);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    const newHistory = [query.trim(), ...searchHistory.filter(h => h !== query.trim())].slice(0, MAX_HISTORY);
    setSearchHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    onClose();
    setSearchQuery('');
    setSuggestions([]);
  }, [navigate, onClose, searchHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 scrim z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 top-0 z-[60] bg-white dark:bg-ink-800 transition-transform duration-300 ease-out"
        style={{ transform: isOpen ? 'translateY(0)' : 'translateY(-100%)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="relative mb-4">
            <IconButton
              type="button"
              aria-label="取消"
              onClick={onClose}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-700 dark:hover:text-ink-300"
            >
              <X size={24} />
            </IconButton>
            <Search
              size={22}
              className="absolute left-10 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索故事、分支、番外、作者..."
              className="w-full h-14 bg-ink-100 dark:bg-ink-700 border-2 border-transparent focus:border-accent-400 rounded-2xl pl-20 pr-6 text-lg font-medium placeholder:text-ink-400 outline-none transition-all"
              autoComplete="off"
            />
          </form>

          {suggestions.length > 0 ? (
            <div className="space-y-2">
              <p className="eyebrow px-2">
                搜索建议
              </p>
              {suggestions.map((item) => (
                <button
                  key={`${item.type}-${item.sourceId}`}
                  type="button"
                  onClick={() => {
                    navigate(getItemLink(item));
                    onClose();
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-accent-100 dark:bg-accent-500/15 flex items-center justify-center shrink-0">
                    <Search size={16} className="text-accent-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-ink-800 dark:text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">
                      {getTypeLabel(item.type)}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-ink-400 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            searchHistory.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-ink-400" />
                    <p className="eyebrow">
                      搜索历史
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHistory}
                    className="text-xs text-ink-400 hover:text-red-500"
                  >
                    清空
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((query) => (
                    <button
                      key={query}
                      type="button"
                      onClick={() => handleSearch(query)}
                      className="px-4 py-2 bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-300 rounded-full text-sm font-medium hover:bg-accent-100 dark:hover:bg-accent-500/15 hover:text-accent-600 dark:hover:text-accent-400 transition-all"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default MobileSearchOverlay;
