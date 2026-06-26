import React from 'react';
import { Search } from 'lucide-react';
import { Modal } from '../../../components/ui';

interface SearchableSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
  loadingText?: string;
  showEmpty?: boolean;
  emptyText?: string;
  showPrompt?: boolean;
  promptText?: string;
  children?: React.ReactNode;
  selectedCount: number;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitLabel: string;
  submitColorClass?: string;
}

const SearchableSelectionModal: React.FC<SearchableSelectionModalProps> = ({
  isOpen, onClose, title,
  searchQuery, onSearchChange, searchPlaceholder = '搜索...',
  isLoading = false, loadingText = '搜索中...',
  showEmpty = false, emptyText,
  showPrompt = false, promptText,
  children,
  selectedCount, notes, onNotesChange, onSubmit, isSubmitting = false, submitLabel,
  submitColorClass = 'bg-accent-600 hover:bg-accent-700',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none focus:ring-2 focus:ring-accent-500"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>

        {isLoading && <p className="text-sm text-ink-400 text-center">{loadingText}</p>}

        {!isLoading && children}

        {showEmpty && emptyText && (
          <p className="text-sm text-ink-400 text-center py-4">{emptyText}</p>
        )}
        {showPrompt && promptText && (
          <p className="text-sm text-ink-400 text-center py-4">{promptText}</p>
        )}

        {selectedCount > 0 && (
          <>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none focus:ring-2 focus:ring-accent-500 resize-none"
              rows={2}
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              placeholder="批量添加导游点评（可选）"
            />
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className={`w-full py-3 text-white rounded-xl font-black disabled:opacity-50 transition-colors ${submitColorClass}`}
            >
              {isSubmitting ? '添加中...' : submitLabel}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default SearchableSelectionModal;
