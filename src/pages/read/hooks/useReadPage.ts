import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useToast } from '../../../components/notifications';
import analytics from '../../../lib/analytics';
import { useChapter, useChaptersByStory } from '../../../hooks/useChapters';
import { useMyBooklists, useAddToBooklist } from '../../../hooks/useBooklists';
import { useReadingContext } from '../../../hooks/useReadingContext';
import { useCreateBranch } from '../../../hooks/useBranches';
import { useSavepoints, useCreateSavepoint, useDeleteSavepoint } from '../../../hooks/useSavepoints';

export const useReadPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToast();

  const queryParams = new URLSearchParams(location.search);
  const referralId = queryParams.get('referralId') || undefined;

  const { data: chapter, isLoading, error } = useChapter(id!, referralId);
  const { data: tocChapters = [], isLoading: isTocLoading } = useChaptersByStory(
    chapter?.story?.id || '',
    undefined,
  );
  const { data: myBooklistsRaw } = useMyBooklists({ enabled: isAuthenticated });
  const myBooklists = myBooklistsRaw || [];

  const readingCtx = useReadingContext(id);

  const createBranch = useCreateBranch();
  const addToBooklist = useAddToBooklist();
  const createSavepoint = useCreateSavepoint();
  const deleteSavepoint = useDeleteSavepoint();

  const [isBooklistModalOpen, setIsBooklistModalOpen] = useState(false);
  const [selectedBooklistId, setSelectedBooklistId] = useState('');
  const [booklistNote, setBooklistNote] = useState('');
  const [isAddingToBooklist, setIsAddingToBooklist] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const [isSavepointsOpen, setIsSavepointsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { data: savepoints = [] } = useSavepoints(
    chapter?.storyId || '',
    isSavepointsOpen && !!chapter?.storyId,
  );

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({ title: '', description: '' });
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

  useEffect(() => {
    if (!chapter) return;
    // 进入章节即记录已访问（progress 0）
    analytics.trackReadingProgress(chapter.id, chapter.storyId, 0);

    // 滚动进度埋点：按滚动比例分档上报 50 / 100，避免高频请求
    let lastReported = 0;
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const ratio = Math.min(1, scrollTop / docHeight);
      const level = ratio >= 0.9 ? 100 : ratio >= 0.5 ? 50 : 0;
      if (level > lastReported) {
        lastReported = level;
        analytics.trackReadingProgress(chapter.id, chapter.storyId, level);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [chapter]);

  const handleAddToBooklist = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooklistId || !chapter) return;
    setIsAddingToBooklist(true);
    try {
      await addToBooklist.mutateAsync({
        booklistId: selectedBooklistId,
        data: { targetType: 'chapter', targetId: chapter.id, notes: booklistNote },
      });
      setAddSuccess(true);
      addToast('success', '已添加到书单');
      setTimeout(() => {
        setIsBooklistModalOpen(false);
        setAddSuccess(false);
        setSelectedBooklistId('');
        setBooklistNote('');
      }, 1500);
    } catch {
      addToast('error', '添加失败');
    } finally {
      setIsAddingToBooklist(false);
    }
  }, [selectedBooklistId, chapter, booklistNote, addToBooklist, addToast]);

  const handleCreateSavepoint = useCallback(async () => {
    if (!chapter) return;
    setIsSaving(true);
    try {
      await createSavepoint.mutateAsync({
        storyId: chapter.storyId,
        chapterId: chapter.id,
        branchId: chapter.branchId || undefined,
      });
      setSaveSuccess(true);
      addToast('success', '存档成功');
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      addToast('error', '存档失败');
    } finally {
      setIsSaving(false);
    }
  }, [chapter, createSavepoint, addToast]);

  const handleDeleteSavepoint = useCallback(async (savepointId: string) => {
    try {
      await deleteSavepoint.mutateAsync({ id: savepointId });
      addToast('success', '存档已删除');
    } catch {
      addToast('error', '删除失败');
    }
  }, [deleteSavepoint, addToast]);

  const handleCreateBranch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapter || !branchForm.title || !branchForm.description) return;
    setIsCreatingBranch(true);
    try {
      const result = await createBranch.mutateAsync({
        parentStoryId: chapter.storyId,
        parentChapterId: chapter.id,
        title: branchForm.title,
        description: branchForm.description,
        branchType: 'parallel',
        authorId: user?.id,
      });
      addToast('success', '分支创建成功');
      setIsBranchModalOpen(false);
      setBranchForm({ title: '', description: '' });
      navigate(`/branch/${result.id}`);
    } catch {
      addToast('error', '创建分支失败');
    } finally {
      setIsCreatingBranch(false);
    }
  }, [chapter, branchForm, createBranch, user, addToast, navigate]);

  return {
    chapter,
    isLoading,
    error,
    tocChapters,
    isTocLoading,
    myBooklists,
    readingCtx,
    isBooklistModalOpen,
    setIsBooklistModalOpen,
    selectedBooklistId,
    setSelectedBooklistId,
    booklistNote,
    setBooklistNote,
    isAddingToBooklist,
    addSuccess,
    isSavepointsOpen,
    setIsSavepointsOpen,
    isSaving,
    saveSuccess,
    savepoints,
    isBranchModalOpen,
    setIsBranchModalOpen,
    branchForm,
    setBranchForm,
    isCreatingBranch,
    handleAddToBooklist,
    handleCreateSavepoint,
    handleDeleteSavepoint,
    handleCreateBranch,
    navigate,
    location,
  };
};