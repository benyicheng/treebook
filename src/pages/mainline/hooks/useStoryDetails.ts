import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useToast } from '../../../components/Toast';
import { useStory, useUpdateStory } from '../../../hooks/useStories';
import { useCreateChapter, useUpdateChapter } from '../../../hooks/useChapters';
import { useCreateBranch } from '../../../hooks/useBranches';
import { useSavepoints } from '../../../hooks/useSavepoints';
import { revenueService } from '../../../api/revenueService';

export const useStoryDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  
  // ─── React Query: data fetching ───
  const { data: currentStory, isLoading } = useStory(id || '');
  const { data: savepoints = [] } = useSavepoints(id || '');
  
  // ─── React Query: mutations ───
  const updateChapter = useUpdateChapter();
  const createChapter = useCreateChapter();
  const createBranch = useCreateBranch();
  const updateStory = useUpdateStory();
  
  // ─── Local UI state ───
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

  const [readingHistory] = useState<any[]>([]);

  // ─── Derived state ───
  const isAuthor = user?.id === currentStory?.authorId;

  // Initialize form defaults when story loads
  useEffect(() => {
    if (currentStory) {
      if (currentStory.chapters?.length > 0 && !newBranchData.parentChapterId) {
        setNewBranchData(prev => ({ ...prev, parentChapterId: currentStory.chapters[0].id }));
      }
      setNewChapterData(prev => ({ ...prev, orderIndex: (currentStory.chapters?.length || 0) + 1 }));
    }
  }, [currentStory]);

  // ─── Handlers ───
  const handleSaveChapter = async (content: string) => {
    if (!editingChapterId) return;
    try {
      await updateChapter.mutateAsync({ id: editingChapterId, data: { content } });
      addToast('success', '章节已保存');
      setEditingChapterId(null);
    } catch (err) {
      addToast('error', '保存失败');
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return addToast('warning', '请先登录');
    setIsSubmitting(true);
    try {
      const branch = await createBranch.mutateAsync({
        ...newBranchData,
        parentStoryId: id,
        branchType: 'parallel',
        isOfficial: isAuthor,
      });
      setIsBranchModalOpen(false);
      navigate(`/branch/${branch.id}`);
    } catch (err) {
      addToast('error', '创建分支失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createChapter.mutateAsync({
        ...newChapterData,
        storyId: id,
        content: '<p>新章节内容...</p>',
      });
      setIsChapterModalOpen(false);
      setNewChapterData({ title: '', orderIndex: (currentStory?.chapters?.length || 0) + 2 });
    } catch (err) {
      addToast('error', '添加章节失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      await updateStory.mutateAsync({ id, data: editStoryData });
      setIsManageModalOpen(false);
      addToast('success', '故事信息已更新');
    } catch (err) {
      addToast('error', '更新失败');
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
      addToast('success', `结算成功！总收益: ${result.totalRevenue.toFixed(2)} UNIV`);
      navigate('/revenue');
    } catch (err) {
      addToast('error', '结算失败');
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
  };
};
