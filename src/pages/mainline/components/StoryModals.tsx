import React from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../../../components/Modal';
import AddToBooklistModal from '../../../components/AddToBooklistModal';
import MergeManagementModal from '../../../components/Merge/MergeManagementModal';

interface StoryModalsProps {
  isBranchModalOpen: boolean;
  setIsBranchModalOpen: (open: boolean) => void;
  isChapterModalOpen: boolean;
  setIsChapterModalOpen: (open: boolean) => void;
  isManageModalOpen: boolean;
  setIsManageModalOpen: (open: boolean) => void;
  isMergeModalOpen: boolean;
  setIsMergeModalOpen: (open: boolean) => void;
  booklistTargetChapter: any;
  setBooklistTargetChapter: (target: any) => void;
  newBranchData: any;
  setNewBranchData: (data: any) => void;
  newChapterData: any;
  setNewChapterData: (data: any) => void;
  editStoryData: any;
  setEditStoryData: (data: any) => void;
  handleCreateBranch: (e: React.FormEvent) => void;
  handleCreateChapter: (e: React.FormEvent) => void;
  handleUpdateStory: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isAuthor: boolean;
  currentStory: any;
  id: string;
  fetchStoryById: (id: string) => void;
}

const StoryModals: React.FC<StoryModalsProps> = ({
  isBranchModalOpen,
  setIsBranchModalOpen,
  isChapterModalOpen,
  setIsChapterModalOpen,
  isManageModalOpen,
  setIsManageModalOpen,
  isMergeModalOpen,
  setIsMergeModalOpen,
  booklistTargetChapter,
  setBooklistTargetChapter,
  newBranchData,
  setNewBranchData,
  newChapterData,
  setNewChapterData,
  editStoryData,
  setEditStoryData,
  handleCreateBranch,
  handleCreateChapter,
  handleUpdateStory,
  isSubmitting,
  isAuthor,
  currentStory,
  id,
  fetchStoryById,
}) => {
  return (
    <>
      <Modal 
        isOpen={isBranchModalOpen} 
        onClose={() => setIsBranchModalOpen(false)} 
        title="创建平行宇宙分支"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">分支标题</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="例如：如果主角选择了另一条路..."
              value={newBranchData.title}
              onChange={e => setNewBranchData((prev: any) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">分支描述</label>
            <textarea 
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              placeholder="简述这个平行宇宙的核心差异..."
              value={newBranchData.description}
              onChange={e => setNewBranchData((prev: any) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">起始章节</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={newBranchData.parentChapterId}
              onChange={e => setNewBranchData((prev: any) => ({ ...prev, parentChapterId: e.target.value }))}
            >
              {currentStory.chapters.map((c: any) => (
                <option key={c.id} value={c.id}>第 {c.orderIndex} 章：{c.title}</option>
              ))}
            </select>
          </div>
          {!isAuthor && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex gap-3 text-amber-600 dark:text-amber-400">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-medium">您正在创建社区分支。您的分支将被标记为“社区”，并展现在平行宇宙树中。</p>
            </div>
          )}
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '正在创建...' : '开启新宇宙'}
          </button>
        </form>
      </Modal>

      <Modal 
        isOpen={isChapterModalOpen} 
        onClose={() => setIsChapterModalOpen(false)} 
        title="添加新章节"
      >
        <form onSubmit={handleCreateChapter} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">章节标题</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="例如：第一章 重生"
              value={newChapterData.title}
              onChange={e => setNewChapterData((prev: any) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">章节顺序</label>
            <input 
              type="number" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={newChapterData.orderIndex}
              onChange={e => setNewChapterData((prev: any) => ({ ...prev, orderIndex: parseInt(e.target.value) }))}
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '正在添加...' : '确认添加'}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title="管理故事信息"
      >
        <form onSubmit={handleUpdateStory} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">故事标题</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={editStoryData.title}
              onChange={e => setEditStoryData((prev: any) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">封面图片 URL</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={editStoryData.coverImage}
              onChange={e => setEditStoryData((prev: any) => ({ ...prev, coverImage: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">故事简介</label>
            <textarea 
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              value={editStoryData.description}
              onChange={e => setEditStoryData((prev: any) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : '保存修改'}
          </button>
        </form>
      </Modal>

      <AddToBooklistModal
        isOpen={!!booklistTargetChapter}
        onClose={() => setBooklistTargetChapter(null)}
        chapterId={booklistTargetChapter?.id || ''}
        chapterTitle={booklistTargetChapter?.title}
      />

      <MergeManagementModal 
        storyId={id || ''}
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        onSuccess={() => {
          if (id) fetchStoryById(id);
        }}
      />
    </>
  );
};

export default StoryModals;
