import React from 'react';
import { useNavigate } from 'react-router-dom';
import StoryBranchTree from '../../components/StoryTree/StoryBranchTree';
import CharacterManager from './CharacterManager';
import { useStoryDetails } from './hooks/useStoryDetails';

// Sub-components
import StoryHeader from './components/StoryHeader';
import StoryOverview from './components/StoryOverview';
import StoryChapterList from './components/StoryChapterList';
import StoryModals from './components/StoryModals';

const MainlinePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    id,
    currentStory,
    isLoading,
    isAuthenticated,
    isAuthor,
    activeTab,
    setActiveTab,
    editingChapterId,
    setEditingChapterId,
    isSubmitting,
    isSettling,
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
    savepoints,
    readingHistory,
    handleSaveChapter,
    handleCreateBranch,
    handleCreateChapter,
    handleUpdateStory,
    handleSettleRevenue,
    fetchStoryById,
  } = useStoryDetails();

  if (isLoading || !currentStory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleManageStory = () => {
    setEditStoryData({
      title: currentStory.title,
      description: currentStory.description || '',
      coverImage: currentStory.coverImage || '',
    });
    setIsManageModalOpen(true);
  };

  const handleCreateSpinoff = (branchId?: string) => {
    if (!id) return;
    const url = branchId 
      ? `/spinoff/create?storyId=${id}&branchId=${branchId}` 
      : `/spinoff/create?storyId=${id}`;
    navigate(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <StoryHeader 
        currentStory={currentStory}
        isAuthor={isAuthor}
        isSettling={isSettling}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleManageStory={handleManageStory}
        handleSettleRevenue={handleSettleRevenue}
        setIsMergeModalOpen={setIsMergeModalOpen}
      />

      <div className="animate-in fade-in duration-500">
        {activeTab === 'overview' && (
          <StoryOverview 
            currentStory={currentStory}
            isAuthenticated={isAuthenticated}
            setActiveTab={setActiveTab}
            handleCreateSpinoff={handleCreateSpinoff}
            setIsBranchModalOpen={setIsBranchModalOpen}
          />
        )}

        {activeTab === 'tree' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-2xl font-black">宇宙分叉网络 (Space-Time Tree)</h3>
              <div className="flex gap-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">主线世界线</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">认证/官方分支</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">平行宇宙</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">精彩番外</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 h-[700px] overflow-hidden shadow-2xl">
              <StoryBranchTree 
                chapters={currentStory.chapters || []} 
                branches={currentStory.branches || []}
                spinoffs={currentStory.spinoffs || []}
                savepoints={savepoints}
                readingHistory={readingHistory}
                onNodeClick={(id, type) => {
                  if (type === 'chapter') {
                    if (isAuthor) {
                      setEditingChapterId(id);
                      setActiveTab('chapters');
                    } else {
                      navigate(`/read/${id}`);
                    }
                  } else if (type === 'branch') {
                    navigate(`/branch/${id}`);
                  } else if (type === 'spinoff') {
                    navigate(`/spinoff/${id}`);
                  }
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'chapters' && (
          <StoryChapterList 
            currentStory={currentStory}
            isAuthor={isAuthor}
            editingChapterId={editingChapterId}
            setEditingChapterId={setEditingChapterId}
            setIsChapterModalOpen={setIsChapterModalOpen}
            setBooklistTargetChapter={setBooklistTargetChapter}
            handleSaveChapter={handleSaveChapter}
            storyId={id!}
          />
        )}

        {activeTab === 'characters' && (
          <CharacterManager storyId={id!} isAuthor={isAuthor} />
        )}
      </div>

      <StoryModals 
        isBranchModalOpen={isBranchModalOpen}
        setIsBranchModalOpen={setIsBranchModalOpen}
        isChapterModalOpen={isChapterModalOpen}
        setIsChapterModalOpen={setIsChapterModalOpen}
        isManageModalOpen={isManageModalOpen}
        setIsManageModalOpen={setIsManageModalOpen}
        isMergeModalOpen={isMergeModalOpen}
        setIsMergeModalOpen={setIsMergeModalOpen}
        booklistTargetChapter={booklistTargetChapter}
        setBooklistTargetChapter={setBooklistTargetChapter}
        newBranchData={newBranchData}
        setNewBranchData={setNewBranchData}
        newChapterData={newChapterData}
        setNewChapterData={setNewChapterData}
        editStoryData={editStoryData}
        setEditStoryData={setEditStoryData}
        handleCreateBranch={handleCreateBranch}
        handleCreateChapter={handleCreateChapter}
        handleUpdateStory={handleUpdateStory}
        isSubmitting={isSubmitting}
        isAuthor={isAuthor}
        currentStory={currentStory}
        id={id!}
        fetchStoryById={fetchStoryById}
      />
    </div>
  );
};

export default MainlinePage;
