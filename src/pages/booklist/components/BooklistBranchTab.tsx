import React from 'react';
import { GitBranch } from 'lucide-react';
import { EmptyState } from '../../../components/ui';
import { useNavigate } from 'react-router-dom';

interface BooklistBranchTabProps {
  booklist: any;
}

export const BooklistBranchTab: React.FC<BooklistBranchTabProps> = ({ booklist }) => {
  const navigate = useNavigate();
  const b = booklist || {};

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
          <GitBranch size={14} className="text-white" />
        </div>
        <h2 className="text-base font-black text-ink-800 dark:text-white tracking-tight">
          分支故事
          <span className="text-sm font-normal text-ink-400 ml-2">({(b.itemsBySection?.branch || []).length})</span>
        </h2>
      </div>
      {(b.itemsBySection?.branch || []).length === 0 ? (
        <EmptyState icon={GitBranch} title="暂无分支内容" compact />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(b.itemsBySection?.branch || []).map((item: any, idx: number) => (
            <button
              key={item.id}
              onClick={() => navigate('/branch/' + item.targetId)}
              className="p-4 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left w-full cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <GitBranch size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink-800 dark:text-white truncate">
                    {item.branch?.title || `分支 #${idx + 1}`}
                  </p>
                  {item.branch?.parentStory && (
                    <p className="text-[11px] text-ink-400 truncate mt-0.5">
                      源自《{item.branch.parentStory.title}》
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {item.branch?.branchType && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 font-medium">
                        {item.branch.branchType === 'parallel' ? '平行分支' :
                         item.branch.branchType === 'alternative' ? 'IF 路线' :
                         item.branch.branchType}
                      </span>
                    )}
                    {item.branch?.isOfficial && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                        官方
                      </span>
                    )}
                    {item.branch?.author && (
                      <span className="text-[10px] text-ink-400 truncate">
                        作者：{item.branch.author.username}
                      </span>
                    )}
                    {item.notes && (
                      <span className="text-[10px] text-ink-400 italic truncate">点评：{item.notes}</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BooklistBranchTab;