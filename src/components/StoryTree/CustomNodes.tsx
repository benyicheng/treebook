import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, BookOpen, Star, ShieldCheck, User } from 'lucide-react';

const ChapterNode = ({ data }: NodeProps) => {
  return (
    <div className="px-4 py-3 shadow-xl rounded-2xl bg-white dark:bg-gray-900 border-2 border-blue-400 min-w-[190px] max-w-[220px] group transition-all hover:scale-105 hover:shadow-blue-200 dark:hover:shadow-blue-900/40 hover:border-blue-600 cursor-pointer">
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-blue-500 border-2 border-white dark:border-gray-900" />
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
          <BookOpen size={16} />
        </div>
        <div className="text-left min-w-0">
          <p className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest">
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
  const colorClass = isOfficial 
    ? 'border-amber-400 hover:border-amber-500 hover:shadow-amber-200 dark:hover:shadow-amber-900/40' 
    : 'border-purple-400 hover:border-purple-500 hover:shadow-purple-200 dark:hover:shadow-purple-900/40';
  const iconBg = isOfficial ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-purple-50 dark:bg-purple-900/30';
  const iconColor = isOfficial ? 'text-amber-600 dark:text-amber-400' : 'text-purple-600 dark:text-purple-400';
  const tagColor = isOfficial ? 'text-amber-500 dark:text-amber-400' : 'text-purple-500 dark:text-purple-400';
  const handleColor = isOfficial ? 'bg-amber-500' : 'bg-purple-500';

  return (
    <div className={`px-4 py-3 shadow-xl rounded-2xl bg-white dark:bg-gray-900 border-2 ${colorClass} min-w-[190px] max-w-[220px] group transition-all hover:scale-105 cursor-pointer`}>
      <Handle type="target" position={Position.Top} className={`w-2.5 h-2.5 ${handleColor} border-2 border-white dark:border-gray-900`} />
      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 ${iconBg} ${iconColor} rounded-xl shrink-0 mt-0.5`}>
          {isOfficial ? <ShieldCheck size={16} /> : <GitBranch size={16} />}
        </div>
        <div className="text-left min-w-0 flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <p className={`text-[9px] font-black ${tagColor} uppercase tracking-widest`}>
              {isOfficial ? '官方分支' : '平行宇宙'}
            </p>
            {data.isHot && <Star size={9} className="fill-amber-400 text-amber-400" />}
          </div>
          <p className="text-sm font-black text-gray-900 dark:text-white line-clamp-2 leading-tight">{data.label}</p>
          
          {/* 底部元信息 */}
          <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800">
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
