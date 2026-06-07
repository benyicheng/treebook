import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, BookOpen, Star, ShieldCheck, User, Crown, Save, Sparkles, Layers, ChevronUp } from 'lucide-react';

const viewModeClass = (modifier?: string) => {
  if (modifier === 'focus') return '!scale-110 !z-20 ring-2 ring-accent-500 ring-offset-2 shadow-accent-200/50 dark:shadow-accent-500/20';
  if (modifier === 'highlighted') return 'ring-2 ring-accent-400 ring-offset-1 !border-accent-400 shadow-accent-200/30';
  if (modifier === 'dimmed') return 'opacity-30 grayscale-[30%] pointer-events-none';
  return '';
};

const ChapterNode = ({ data, id }: NodeProps) => {
  const isRead = data.isRead;
  const hasSavepoint = data.hasSavepoint;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      data.onActivate?.(id.slice(8), 'chapter');
    }
  }, [data.onActivate, id]);

  return (
    <div 
      tabIndex={0}
      role="button"
      aria-label={`第 ${data.orderIndex} 章：${data.label}${isRead ? ' (已读)' : ''}`}
      onKeyDown={handleKeyDown}
      className={`px-4 py-3 shadow-xl rounded-2xl bg-ink-50 dark:bg-ink-800 border-2 ${isRead ? 'border-accent-400' : 'border-blue-400'} ${viewModeClass(data.viewModeModifier)} min-w-[190px] max-w-[220px] group transition-all hover:scale-105 hover:shadow-accent-200 dark:hover:shadow-accent-500/15 hover:border-accent-500 cursor-pointer relative`}>
      {hasSavepoint && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-ink-800 z-10 animate-pulse">
          <Save size={12} />
        </div>
      )}
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-accent-400 border-2 border-white dark:border-ink-800" />
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 ${isRead ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-500 dark:text-accent-400' : 'bg-accent-50 dark:bg-accent-500/15 text-accent-500 dark:text-accent-400'} rounded-xl shrink-0`}>
          <BookOpen size={16} />
        </div>
        <div className="text-left min-w-0">
          <p className={`text-[9px] font-black ${isRead ? 'text-accent-400' : 'text-accent-400'} dark:text-accent-400 uppercase tracking-widest`}>
            {data.orderIndex ? `第 ${data.orderIndex} 章` : '主线章节'}
          </p>
          <p className="text-sm font-black text-ink-800 dark:text-white line-clamp-2 leading-tight">{data.label}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-accent-400 border-2 border-white dark:border-ink-800" />
      <Handle type="source" position={Position.Bottom} id="branch" className="w-2.5 h-2.5 bg-purple-500 border-2 border-white dark:border-ink-800" />
    </div>
  );
};

const BranchNode = ({ data, id }: NodeProps) => {
  const isOfficial = data.isOfficial;
  const isCertified = data.isCertified;
  const isRead = data.isRead;
  
  const borderColor = isCertified ? 'border-amber-500 shadow-amber-100' : (isOfficial ? 'border-amber-400' : 'border-purple-400');
  const colorClass = `${borderColor} hover:border-accent-400 hover:shadow-accent-200 dark:hover:shadow-accent-500/15`;
  
  const iconBg = isCertified ? 'bg-amber-100 dark:bg-amber-900/50' : (isOfficial ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-purple-50 dark:bg-purple-900/30');
  const iconColor = isCertified ? 'text-amber-700 dark:text-amber-300' : (isOfficial ? 'text-amber-600 dark:text-amber-400' : 'text-accent-500 dark:text-purple-400');
  const tagColor = isCertified ? 'text-amber-600' : (isOfficial ? 'text-amber-500' : 'text-purple-500');
  const handleColor = isOfficial || isCertified ? 'bg-amber-500' : 'bg-purple-500';

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      data.onActivate?.(id.slice(7), 'branch');
    }
  }, [data.onActivate, id]);

  return (
    <div 
      tabIndex={0}
      role="button"
      aria-label={`分支：${data.label}${isRead ? ' (已读)' : ''}`}
      onKeyDown={handleKeyDown}
      className={`px-4 py-3 shadow-xl rounded-2xl bg-ink-50 dark:bg-ink-800 border-2 ${colorClass} ${viewModeClass(data.viewModeModifier)} min-w-[190px] max-w-[220px] group transition-all hover:scale-105 cursor-pointer relative`}>
      {isCertified && (
        <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-xl flex items-center justify-center shadow-xl border-2 border-white dark:border-ink-800 z-10 rotate-[-12deg]">
          <Crown size={18} className="drop-shadow-sm" />
        </div>
      )}
      
      <Handle type="target" position={Position.Top} className={`w-2.5 h-2.5 ${handleColor} border-2 border-white dark:border-ink-800`} />
      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 ${iconBg} ${iconColor} rounded-xl shrink-0 mt-0.5`}>
          {isCertified ? <ShieldCheck size={16} /> : (isOfficial ? <ShieldCheck size={16} /> : <GitBranch size={16} />)}
        </div>
        <div className="text-left min-w-0 flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <p className={`text-[9px] font-black ${tagColor} uppercase tracking-widest`}>
              {isCertified ? '金级分支' : (isOfficial ? '官方分支' : '平行宇宙')}
            </p>
            {(data.isHot || isCertified) && <Star size={9} className="fill-amber-400 text-amber-400" />}
          </div>
          <p className="text-sm font-black text-ink-800 dark:text-white line-clamp-2 leading-tight">{data.label}</p>
          
          <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-ink-100 dark:border-ink-700">
            {isRead && <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" />}
            {data.chapterCount !== undefined && (
              <span className="text-[10px] text-ink-400 font-bold">
                {data.chapterCount} 章
              </span>
            )}
            {data.authorName && (
              <span className="flex items-center gap-0.5 text-[10px] text-ink-400">
                <User size={9} />
                {data.authorName}
              </span>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className={`w-2.5 h-2.5 ${handleColor} border-2 border-white dark:border-ink-800`} />
    </div>
  );
};


const SpinoffNode = ({ data, id }: NodeProps) => {
  const isOfficial = data.isOfficial;
  const spinoffType = data.spinoffType;

  const typeLabel =
    spinoffType === 'biography' ? '传记' :
    spinoffType === 'world_expansion' ? '设定' : '平行线';

  const borderColor = isOfficial ? 'border-amber-400 shadow-amber-100' : 'border-indigo-400';
  const iconBg = isOfficial ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : 'bg-indigo-50 dark:bg-indigo-900/40 text-accent-600 dark:text-indigo-400';

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      data.onActivate?.(id.slice(8), 'spinoff');
    }
  }, [data.onActivate, id]);

  return (
    <div 
      tabIndex={0}
      role="button"
      aria-label={`番外：${data.label || '无标题'}`}
      onKeyDown={handleKeyDown}
      className={`px-4 py-3 shadow-xl rounded-2xl bg-ink-50 dark:bg-ink-800 border-2 ${borderColor} ${viewModeClass(data.viewModeModifier)} min-w-[190px] max-w-[220px] group transition-all hover:scale-105 hover:shadow-indigo-200 dark:hover:shadow-indigo-900/40 hover:border-accent-600 cursor-pointer relative`}>
      <Handle type="target" position={Position.Top} className={`w-2.5 h-2.5 ${isOfficial ? 'bg-amber-500' : 'bg-accent-500'} border-2 border-white dark:border-ink-800`} />
      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 ${iconBg} rounded-xl shrink-0 mt-0.5`}>
          <Sparkles size={16} />
        </div>
        <div className="text-left min-w-0 flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <p className={`text-[9px] font-black uppercase tracking-widest ${isOfficial ? 'text-amber-500' : 'text-accent-500'}`}>
              番外
            </p>
            <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${
              spinoffType === 'biography' ? 'bg-accent-100 text-accent-500' :
              spinoffType === 'world_expansion' ? 'bg-accent-100 text-accent-500' :
              'bg-indigo-100 text-accent-600'
            }`}>
              {typeLabel}
            </span>
          </div>
          <p className="text-sm font-black text-ink-800 dark:text-white line-clamp-2 leading-tight">{data.label || '番外'}</p>
          {data.authorName && (
            <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-ink-100 dark:border-ink-700">
              <span className="flex items-center gap-0.5 text-[10px] text-ink-400">
                <User size={9} />
                {data.authorName}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BranchClusterNode = ({ data }: NodeProps) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      data.onToggle?.();
    }
  }, [data.onToggle]);

  return (
    <div 
      tabIndex={0}
      role="button"
      aria-label={`平行宇宙群，${data.count} 个分支，点击展开`}
      onKeyDown={handleKeyDown}
      className="px-5 py-4 shadow-xl rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border-2 border-purple-300 dark:border-purple-700 min-w-[200px] group transition-all hover:scale-105 hover:shadow-purple-200 dark:hover:shadow-purple-900/40 hover:border-purple-500 cursor-pointer">
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-purple-500 border-2 border-white dark:border-ink-800" />
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="p-2 bg-accent-100 dark:bg-purple-900/50 text-accent-500 dark:text-purple-400 rounded-xl">
            <Layers size={20} />
          </div>
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-md border-2 border-white dark:border-ink-800">
            {data.count}
          </div>
        </div>
        <div className="text-left">
          <p className="text-xs font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider">
            平行宇宙群
          </p>
          <p className="text-[10px] text-purple-500 dark:text-purple-400 font-medium mt-0.5">
            点击展开 {data.count} 个分支
          </p>
        </div>
      </div>
    </div>
  );
};

const CollapseButtonNode = ({ data }: NodeProps) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      data.onToggle?.();
    }
  }, [data.onToggle]);

  return (
    <div 
      tabIndex={0}
      role="button"
      aria-label={`收起 ${data.count} 个分支`}
      onKeyDown={handleKeyDown}
      className="px-3 py-1.5 rounded-xl bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-600 shadow-md cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950 transition-all">
      <div className="flex items-center gap-1.5">
        <ChevronUp size={12} className="text-purple-500" />
        <span className="text-[10px] font-bold text-accent-500 dark:text-purple-400">
          收起 {data.count} 个分支
        </span>
      </div>
    </div>
  );
};

export const nodeTypes = {
  chapter: memo(ChapterNode),
  branch: memo(BranchNode),
  spinoff: memo(SpinoffNode),
  branchCluster: memo(BranchClusterNode),
  collapseButton: memo(CollapseButtonNode),
};
