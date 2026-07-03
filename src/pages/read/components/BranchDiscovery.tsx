import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BranchDiscoveryProps {
  chapter: any;
}

export const BranchDiscovery: React.FC<BranchDiscoveryProps> = ({ chapter }) => {
  if (!chapter?.branchesFrom?.length) return null;

  return (
    <div className="my-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-px bg-ink-200 dark:bg-ink-600" />
        <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 text-accent-400">
          <rect x="6" y="0" width="8.485" height="8.485" transform="rotate(45 6 0)" fill="currentColor" opacity="0.4" />
        </svg>
        <span className="text-xs font-black text-ink-400 uppercase tracking-widest whitespace-nowrap">
          故事在此分歧
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 text-accent-400">
          <rect x="6" y="0" width="8.485" height="8.485" transform="rotate(45 6 0)" fill="currentColor" opacity="0.4" />
        </svg>
        <div className="flex-1 h-px bg-ink-200 dark:bg-ink-600" />
      </div>

      <div className="p-6 md:p-8 bg-ink-50 dark:bg-ink-700 rounded-xl border border-ink-100 dark:border-ink-600 shadow-sm">
        <p className="text-center text-ink-400 text-sm font-medium mb-6">
          在这个时间节点，{chapter.branchesFrom.length} 个平行宇宙从此分叉
        </p>
        <div className="grid grid-cols-1 gap-3">
          {chapter.branchesFrom.map((branch: any, idx: number) => (
            <Link
              key={branch.id}
              to={`/branch/${branch.id}`}
              className="flex items-center gap-4 p-4 rounded-lg border border-ink-100 dark:border-ink-600 hover:border-accent-300 hover:shadow-sm transition-all group bg-ink-50/50 dark:bg-transparent"
            >
              <div className={`w-9 h-9 flex items-center justify-center rounded-md text-sm font-black shrink-0 ${
                branch.isOfficial
                  ? 'bg-accent-100 text-accent-600'
                  : 'bg-ink-100 text-ink-500'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-bold text-ink-700 dark:text-ink-100 group-hover:text-accent-600 transition-colors">
                    {branch.title}
                  </h4>
                  {branch.isOfficial ? (
                    <span className="px-1.5 py-0.5 bg-accent-500 text-white text-[9px] font-black rounded-full uppercase tracking-wide">
                      官方
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-accent-100 text-accent-600 text-[9px] font-black rounded-full uppercase tracking-wide">
                      社区
                    </span>
                  )}
                </div>
                {branch.description && (
                  <p className="text-sm text-ink-400 line-clamp-1 mb-1.5">{branch.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-ink-400">
                  {(branch as any)._count?.chapters !== undefined && (
                    <span className="font-medium">{(branch as any)._count.chapters} 章</span>
                  )}
                  {branch.author && (
                    <>
                      <span className="w-1 h-1 bg-ink-200 rounded-full" />
                      <span>{branch.author.username} 著</span>
                    </>
                  )}
                  {(branch as any).viewCount > 0 && (
                    <>
                      <span className="w-1 h-1 bg-ink-200 rounded-full" />
                      <span>{(branch as any).viewCount.toLocaleString()} 读</span>
                    </>
                  )}
                </div>
              </div>
              <ArrowRight size={18} className="text-ink-300 group-hover:text-accent-500 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BranchDiscovery;