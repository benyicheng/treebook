import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Edit3, Coins, GitPullRequest, GitBranch, MessageSquare, Users, Calendar } from 'lucide-react';
import { useToast } from '../../../components/notifications';
import { FollowButton } from '../../../components/Interaction';

interface StoryHeaderProps {
  currentStory: any;
  isAuthor: boolean;
  isSettling: boolean;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  handleManageStory: () => void;
  handleSettleRevenue: () => void;
  setIsMergeModalOpen: (open: boolean) => void;
}

const StoryHeader: React.FC<StoryHeaderProps> = ({
  currentStory,
  isAuthor,
  isSettling,
  activeTab,
  setActiveTab,
  handleManageStory,
  handleSettleRevenue,
  setIsMergeModalOpen,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  return (
    <div className="bg-white dark:bg-ink-700 rounded-3xl overflow-hidden shadow-xl border border-ink-100 dark:border-ink-600">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img 
          src={currentStory.coverImage || `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(currentStory.title)}+background&image_size=landscape_16_9`} 
          className="w-full h-full object-cover"
          alt={currentStory.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-800 via-ink-800/40 to-transparent"></div>
        <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-accent-500 text-white text-xs font-black rounded-full uppercase tracking-wider">主线故事</span>
              {currentStory.author?.role === 'author' && (
                <span className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-full uppercase tracking-wider">官方认证</span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{currentStory.title}</h1>
            <div className="flex items-center gap-4 text-ink-300">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent-400 flex items-center justify-center text-white font-bold text-xs">
                  {currentStory.author?.username?.[0] || 'A'}
                </div>
                <span className="text-sm font-bold">{currentStory.author?.username}</span>
                {currentStory.author?.id && (
                  <FollowButton targetUserId={currentStory.author.id} size="sm" />
                )}
              </div>
              <span className="w-1 h-1 bg-ink-500 rounded-full"></span>
              <span className="text-sm">{new Date(currentStory.createdAt).toLocaleDateString()} 发布</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                const firstChapterId = currentStory.chapters?.[0]?.id;
                if (firstChapterId) {
                  navigate(`/read/${firstChapterId}`);
                } else {
                  addToast('warning', '该故事暂无章节，请先添加章节');
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-ink-50 text-ink-800 rounded-2xl font-bold hover:bg-ink-100 transition-all shadow-lg active:scale-95"
            >
              <BookOpen size={18} />
              开始阅读
            </button>
            {isAuthor && (
              <button 
                onClick={handleManageStory}
                className="flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-2xl font-bold hover:bg-accent-600 transition-all shadow-lg active:scale-95"
              >
                <Edit3 size={18} />
                管理故事
              </button>
            )}
            {isAuthor && (
              <button 
                onClick={handleSettleRevenue}
                disabled={isSettling}
                className="flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-2xl font-bold hover:bg-accent-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Coins size={18} />
                {isSettling ? '结算中...' : '收益结算'}
              </button>
            )}
            {isAuthor && (
              <button 
                onClick={() => setIsMergeModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-accent-100 text-accent-600 rounded-2xl font-bold hover:bg-indigo-200 transition-all shadow-lg active:scale-95"
              >
                <GitPullRequest size={18} />
                合并管理
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-8 border-b border-ink-100 dark:border-ink-600">
        {[
          { id: 'overview', label: '详情概览', icon: BookOpen },
          { id: 'tree', label: '平行宇宙树', icon: GitBranch },
          { id: 'chapters', label: '章节目录', icon: MessageSquare },
          { id: 'characters', label: '角色档案', icon: Users },
          { id: 'events', label: '大事件', icon: Calendar },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all relative ${
              activeTab === tab.id 
                ? 'text-accent-500 dark:text-accent-400' 
                : 'text-ink-500 hover:text-ink-600 dark:hover:text-ink-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-500 rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StoryHeader;
