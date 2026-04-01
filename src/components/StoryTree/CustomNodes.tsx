import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, BookOpen, Star, ShieldCheck, User, Crown, Save } from 'lucide-react';

const ChapterNode = ({ data }: NodeProps) => {
  const isRead = data.isRead;
  const hasSavepoint = data.hasSavepoint;

  return (
    <div className={`px-4 py-3 shadow-xl rounded-2xl bg-white dark:bg-gray-900 border-2 ${isRead ? 'border-emerald-400' : 'border-blue-400'} min-w-[190px] max-w-[220px] group transition-all hover:scale-105 hover:shadow-blue-200 dark:hover:shadow-blue-900/40 hover:border-blue-600 cursor-pointer relative`}>
      {hasSavepoint && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900 z-10 animate-pulse">
          <Save size={12} />
        </div>
      )}
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-blue-500 border-2 border-white dark:border-gray-900" />
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 ${isRead ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'} rounded-xl shrink-0`}>
          <BookOpen size={16} />
        </div>
        <div className="text-left min-w-0">
          <p className={`text-[9px] font-black ${isRead ? 'text-emerald-500' : 'text-blue-500'} dark:text-blue-400 uppercase tracking-widest`}>
            {data.orderIndex ? `第 ${data.orderIndex} 章` : '主线章节'}
          </p>
          <p className="text-sm font-black text-gray-900 dark:text-white line-clamp-2 leading-tight">{data.label}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-blue-500 border-2 border-white dark:border-gray-900" />
      <Handle type="source" position={Position.Bottom} id="branch" className="w-2.5 h-2.5 bg-purple-500 border-2 border-white dark:border-gray-900" />
    </div>
  );
};

const BranchNode = ({ data }: NodeProps) => {
  const isOfficial = data.isOfficial;
  const isCertified = data.isCertified;
  const isRead = data.isRead;
  
  const borderColor = isCertified ? 'border-amber-500 shadow-amber-100' : (isOfficial ? 'border-amber-400' : 'border-purple-400');
  const colorClass = `${borderColor} hover:border-blue-500 hover:shadow-blue-200 dark:hover:shadow-blue-900/40`;
  
  const iconBg = isCertified ? 'bg-amber-100 dark:bg-amber-900/50' : (isOfficial ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-purple-50 dark:bg-purple-900/30');
  const iconColor = isCertified ? 'text-amber-700 dark:text-amber-300' : (isOfficial ? 'text-amber-600 dark:text-amber-400' : 'text-purple-600 dark:text-purple-400');
  const tagColor = isCertified ? 'text-amber-600' : (isOfficial ? 'text-amber-500' : 'text-purple-500');
  const handleColor = isOfficial || isCertified ? 'bg-amber-500' : 'bg-purple-500';

  return (
    <div className={`px-4 py-3 shadow-xl rounded-2xl bg-white dark:bg-gray-900 border-2 ${colorClass} min-w-[190px] max-w-[220px] group transition-all hover:scale-105 cursor-pointer relative`}>
      {isCertified && (
        <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-xl flex items-center justify-center shadow-xl border-2 border-white dark:border-gray-900 z-10 rotate-[-12deg]">
          <Crown size={18} className="drop-shadow-sm" />
        </div>
      )}
      
      <Handle type="target" position={Position.Top} className={`w-2.5 h-2.5 ${handleColor} border-2 border-white dark:border-gray-900`} />
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
          <p className="text-sm font-black text-gray-900 dark:text-white line-clamp-2 leading-tight">{data.label}</p>
          
          <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800">
            {isRead && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
            {data.chapterCount !== undefined && (
              <span className="text-[10px] text-gray-400 font-bold">
                {data.chapterCount} 章
              </span>
            )}
            {data.authorName && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                <User size={9} />
                {data.authorName}
              </span>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className={`w-2.5 h-2.5 ${handleColor} border-2 border-white dark:border-gray-900`} />
    </div>
  );
};


export const nodeTypes = {
  chapter: memo(ChapterNode),
  branch: memo(BranchNode),
};
