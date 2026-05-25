import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStoryStore } from '../../../stores/useStoryStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { chapterService, branchService, storyService, savepointService } from '../../../api/storyService';
import { revenueService } from '../../../api/revenueService';

export const useStoryDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentStory, fetchStoryById, isLoading } = useStoryStore();
  const { user, isAuthenticated } = useAuthStore();
  
  const initialTab = (searchParams.get('tab') as 'overview' | 'tree' | 'chapters' | 'characters') || 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'tree' | 'chapters' | 'characters'>(initialTab);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  
  // Modal States
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [booklistTargetChapter, setBooklistTargetChapter] = useState<{ id: string; title: string } | null>(null);

  const [newBranchData, setNewBranchData] = useState({
    title: '',
    description: '',
    parentChapterId: '',
  });
  
  const [newChapterData, setNewChapterData] = useState({
    title: '',
    orderIndex: 0,
  });
  
  const [editStoryData, setEditStoryData] = useState({
    title: '',
    description: '',
    coverImage: '',
  });

  const [savepoints, setSavepoints] = useState<any[]>([]);
  const [readingHistory, setReadingHistory] = useState<any[]>([]);

  const isAuthor = user?.id === currentStory?.authorId;

  const fetchTimeData = useCallback(async (storyId: string) => {
    try {
      const sp = await savepointService.getAll({ storyId });
      setSavepoints(sp);
    } catch (err) {
      console.error('Failed to fetch time data:', err);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchStoryById(id);
    }
  }, [id, fetchStoryById]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchTimeData(id);
    }
  }, [isAuthenticated, id, fetchTimeData]);

  useEffect(() => {
    if (currentStory) {
      if (currentStory.chapters.length > 0 && !newBranchData.parentChapterId) {
        setNewBranchData(prev => ({ ...prev, parentChapterId: currentStory.chapters[0].id }));
      }
      setNewChapterData(prev => ({ ...prev, orderIndex: currentStory.chapters.length + 1 }));
    }
  }, [currentStory, newBranchData.parentChapterId]);

  const handleSaveChapter = async (content: string) => {
    if (editingChapterId) {
      try {
        await chapterService.update(editingChapterId, { content });
        alert('章节已保存');
        setEditingChapterId(null);
        if (id) fetchStoryById(id);
      } catch (err) {
        alert('保存失败');
      }
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return alert('请先登录');
    setIsSubmitting(true);
    try {
      const branch = await branchService.create({
        ...newBranchData,
        parentStoryId: id,
        branchType: 'parallel',
        isOfficial: isAuthor,
      });
      setIsBranchModalOpen(false);
      navigate(`/branch/${branch.id}`);
    } catch (err) {
      alert('创建分支失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await chapterService.create({
        ...newChapterData,
        storyId: id,
        content: '<p>新章节内容...</p>',
      });
      setIsChapterModalOpen(false);
      if (id) fetchStoryById(id);
      setNewChapterData({ title: '', orderIndex: (currentStory?.chapters.length || 0) + 2 });
    } catch (err) {
      alert('添加章节失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      await storyService.update(id, editStoryData);
      setIsManageModalOpen(false);
      fetchStoryById(id);
      alert('故事信息已更新');
    } catch (err) {
      alert('更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettleRevenue = async () => {
    if (!id || isSettling) return;
    if (!window.confirm('确定要为该故事进行收益结算吗？')) return;
    
    setIsSettling(true);
    try {
      const result = await revenueService.settleStory(id);
      alert(`结算成功！\n总收益: ${result.totalRevenue.toFixed(2)} UNIV`);
      navigate('/revenue');
    } catch (err) {
      alert('结算失败');
    } finally {
      setIsSettling(false);
    }
  };

  return {
    id,
    currentStory,
    isLoading,
    user,
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
  };
};
