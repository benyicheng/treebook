import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { storyService, spinoffService, branchService, chapterService } from '../../api/storyService';
import { characterService } from '../../api/characterService';
import type { Story, Character, Spinoff } from '../../api/types';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToast } from '../../components/notifications';
import { 
  Save, ArrowLeft, Book, Users, Info, 
  Layout, Type, ChevronRight, AlertCircle, 
  Sparkles, ShieldCheck, History, Search, GitBranch
} from 'lucide-react';
import { ChapterEditor } from '../../components/Editor';
import { Button, IconButton, Input, Textarea } from '../../components/ui';

const SpinoffEditorPage: React.FC = () => {
  const { id } = useParams(); // Spinoff ID (if editing)
  const [searchParams] = useSearchParams();
  const storyIdFromQuery = searchParams.get('storyId');
  const branchIdFromQuery = searchParams.get('branchId');
  const eventIdFromQuery = searchParams.get('eventId');
  
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Step State
  const [currentStep, setCurrentStep] = useState<'select-story' | 'select-chapter' | 'edit'>('edit');
  
  // Selection State
  const [availableStories, setAvailableStories] = useState<Story[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableChapters, setAvailableChapters] = useState<any[]>([]);
  const [chapterSearchQuery, setChapterSearchQuery] = useState('');

  // Form State
  const [spinoff, setSpinoff] = useState<Partial<Spinoff>>({
    title: '',
    summary: '',
    content: '',
    type: 'if_timeline',
    originalStoryId: storyIdFromQuery || '',
    originalBranchId: branchIdFromQuery || '',
    originalEventId: eventIdFromQuery || '',
  });

  // Main Story Context
  const [originalStory, setOriginalStory] = useState<Story | null>(null);
  const [originalBranch, setOriginalBranch] = useState<any>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  
  const [activeTab, setActiveTab] = useState<'editor' | 'settings'>('editor');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        if (id) {
          // Edit mode
          const data = await spinoffService.getById(id);
          setSpinoff(data);
          setSelectedCharIds(data.referencedCharacters ? JSON.parse(data.referencedCharacters) : []);
          
          const storyData = await storyService.getById(data.originalStoryId);
          setOriginalStory(storyData);
          const chars = await characterService.getCharacters(data.originalStoryId);
          setCharacters(chars);

          if (data.originalBranchId) {
            const branchData = await branchService.getById(data.originalBranchId);
            setOriginalBranch(branchData);
          }
          setCurrentStep('edit');
        } else if (storyIdFromQuery) {
          // Create mode with storyId
          const storyData = await storyService.getById(storyIdFromQuery);
          setOriginalStory(storyData);
          const chars = await characterService.getCharacters(storyIdFromQuery);
          setCharacters(chars);

          if (branchIdFromQuery) {
            const branchData = await branchService.getById(branchIdFromQuery);
            setOriginalBranch(branchData);
            setSpinoff(prev => ({ ...prev, originalChapterId: branchData.parentChapterId }));
            setCurrentStep('edit');
          } else {
            // No branch — let user pick a chapter
            const chapters = await chapterService.getByStory(storyIdFromQuery);
            setAvailableChapters(Array.isArray(chapters) ? chapters : chapters?.data || []);
            setCurrentStep('select-chapter');
          }
        } else {
          // NEW: Select Story Step
          setCurrentStep('select-story');
          const allStories = await storyService.getAll();
          setAvailableStories(Array.isArray(allStories) ? allStories : (allStories as any).data || []);
        }
      } catch (err) {
        console.error('Failed to load spinoff data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, storyIdFromQuery, isAuthenticated, navigate]);

  const handleSelectStory = async (story: Story) => {
    setIsLoading(true);
    try {
      setOriginalStory(story);
      setSpinoff(prev => ({ ...prev, originalStoryId: story.id }));
      const chars = await characterService.getCharacters(story.id);
      setCharacters(chars);
      // Load chapters for chapter selection step
      const chapters = await chapterService.getByStory(story.id);
      setAvailableChapters(Array.isArray(chapters) ? chapters : chapters?.data || []);
      setCurrentStep('select-chapter');
    } catch (err) {
      console.error('Failed to load story context');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChapter = (chapter: any) => {
    setSpinoff(prev => ({ ...prev, originalChapterId: chapter.id }));
    setCurrentStep('edit');
  };

  const handleSave = async (content?: string, meta?: { auto?: boolean }) => {
    // 自动保存时，尚未创建的番外先不自动落库（避免误创建/重复创建），等用户显式保存
    if (meta?.auto && !id) return;
    setIsSaving(true);
    try {
      const payload = {
        ...spinoff,
        content: content || spinoff.content,
        originalEventId: spinoff.originalEventId || null,
        referencedCharacters: JSON.stringify(selectedCharIds),
      };

      if (id) {
        await spinoffService.update(id, payload);
        if (!meta?.auto) addToast('success', '已保存');
      } else {
        const created = await spinoffService.create(payload);
        addToast('success', '已创建');
        navigate(`/spinoff/edit/${created.id}`, { replace: true });
      }
    } catch (err) {
      if (!meta?.auto) addToast('error', '保存失败');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCharacter = (charId: string) => {
    setSelectedCharIds(prev => 
      prev.includes(charId) ? prev.filter(i => i !== charId) : [...prev, charId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  // --- STEP 1: SELECT STORY ---
  if (currentStep === 'select-story') {
    const filteredStories = (availableStories || []).filter(s => 
      (s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-ink-50 dark:bg-ink-800 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-ink-800 dark:text-white">选择原著世界观</h1>
              <p className="text-ink-500 mt-2 font-medium">所有的番外创作都需要基于一个现有的主线故事。</p>
            </div>
            <IconButton
              aria-label="返回"
              onClick={() => navigate(-1)}
              className="p-3 bg-ink-50 dark:bg-ink-700 rounded-2xl border border-ink-100 dark:border-ink-600 text-ink-400 hover:text-ink-800"
            >
              <ArrowLeft size={20} />
            </IconButton>
          </div>

          <Input
            type="text"
            placeholder="搜索故事标题..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            wrapperClassName="w-full"
            className="pl-16 pr-6 py-5 border-ink-100 dark:border-ink-700 rounded-[2rem] shadow-sm font-medium"
            leftIcon={<Search size={20} className="text-ink-400 ml-3" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStories.map(story => (
              <div 
                key={story.id} 
                onClick={() => handleSelectStory(story)}
                className="group bg-ink-50 dark:bg-ink-800 p-6 rounded-[2.5rem] border border-ink-100 dark:border-ink-700 hover:border-accent-400 transition-all cursor-pointer flex gap-4 items-center"
              >
                <div className="w-16 h-20 bg-accent-50 dark:bg-accent-800/30 rounded-2xl flex items-center justify-center shrink-0">
                  <Book className="text-accent-600" size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-ink-800 dark:text-white truncate group-hover:text-accent-600 transition-colors">{story.title}</h3>
                  <p className="text-xs text-ink-400 mt-1 line-clamp-2 leading-relaxed">{story.description}</p>
                </div>
                <ChevronRight className="text-ink-300 group-hover:text-accent-600 transition-colors" />
              </div>
            ))}
          </div>

          {filteredStories.length === 0 && (
            <div className="text-center py-20">
              <Book className="mx-auto text-ink-200 mb-4" size={64} />
              <p className="text-ink-400 font-bold">没有找到匹配的故事</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- STEP 2: SELECT CHAPTER ---
  if (currentStep === 'select-chapter') {
    const filteredChapters = (availableChapters || []).filter((c: any) => 
      (c.title || '').toLowerCase().includes(chapterSearchQuery.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-ink-50 dark:bg-ink-800 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-ink-800 dark:text-white">选择关联章节</h1>
              <p className="text-ink-500 mt-2 font-medium">
                番外将关联到 <span className="font-bold text-accent-600">{originalStory?.title}</span> 的哪个章节？
              </p>
            </div>
            <IconButton
              aria-label="返回选择故事"
              onClick={() => setCurrentStep('select-story')}
              className="p-3 bg-ink-50 dark:bg-ink-700 rounded-2xl border border-ink-100 dark:border-ink-600 text-ink-400 hover:text-ink-800"
            >
              <ArrowLeft size={20} />
            </IconButton>
          </div>

          <Input
            type="text"
            placeholder="搜索章节标题..."
            value={chapterSearchQuery}
            onChange={e => setChapterSearchQuery(e.target.value)}
            wrapperClassName="w-full"
            className="pl-16 pr-6 py-5 border-ink-100 dark:border-ink-700 rounded-[2rem] shadow-sm font-medium"
            leftIcon={<Search size={20} className="text-ink-400 ml-3" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredChapters.map((chapter: any) => (
              <div 
                key={chapter.id} 
                onClick={() => handleSelectChapter(chapter)}
                className="group bg-ink-50 dark:bg-ink-800 p-6 rounded-[2.5rem] border border-ink-100 dark:border-ink-700 hover:border-accent-400 transition-all cursor-pointer flex gap-4 items-center"
              >
                <div className="w-12 h-12 bg-accent-50 dark:bg-accent-800/30 rounded-2xl flex items-center justify-center shrink-0">
                  <Book className="text-accent-600" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-ink-800 dark:text-white truncate group-hover:text-accent-600 transition-colors">
                    第 {chapter.orderIndex} 章：{chapter.title}
                  </h3>
                  <p className="text-xs text-ink-400 mt-1 line-clamp-2 leading-relaxed">{chapter.summary || chapter.content?.slice(0, 120)}</p>
                </div>
                <ChevronRight className="text-ink-300 group-hover:text-accent-600 transition-colors" />
              </div>
            ))}
          </div>

          {filteredChapters.length === 0 && (
            <div className="text-center py-20">
              <Book className="mx-auto text-ink-200 mb-4" size={64} />
              <p className="text-ink-400 font-bold">该故事暂无可用章节</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- STEP 3: EDITOR ---
  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-800 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-ink-800 border-b border-ink-100 dark:border-ink-700 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <IconButton
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="p-2 text-ink-400 hover:text-ink-800 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-ink-700 rounded-xl"
          >
            <ArrowLeft size={20} />
          </IconButton>
          <div className="h-8 w-[1px] bg-ink-200 dark:bg-ink-600"></div>
          <div>
            <h1 className="text-lg font-black text-ink-800 dark:text-white flex items-center gap-2">
              <Sparkles className="text-accent-500" size={18} />
              {id ? '编辑番外' : '发布新番外'}
            </h1>
            <p className="text-xs text-ink-400 font-bold uppercase tracking-wider">
              原著：{originalStory?.title} {originalBranch && `• 时空分支：${originalBranch.title}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-ink-100 dark:bg-ink-700 rounded-xl p-1">
            <button 
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'editor' 
                  ? 'bg-white dark:bg-ink-600 text-accent-600 shadow-sm' 
                  : 'text-ink-500 hover:text-ink-600'
              }`}
            >
              <Type size={16} />
              编辑器
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'settings' 
                  ? 'bg-white dark:bg-ink-600 text-accent-600 shadow-sm' 
                  : 'text-ink-500 hover:text-ink-600'
              }`}
            >
              <Layout size={16} />
              番外设定
            </button>
          </div>
          
          <Button
            variant="primary"
            onClick={() => handleSave()}
            loading={isSaving}
            leftIcon={<Save size={18} />}
            className="px-6 py-2 bg-accent-600 hover:bg-accent-700 rounded-xl shadow-lg shadow-accent-500/20"
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Context / Wiki */}
        <aside className="w-80 border-r border-ink-100 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 overflow-y-auto hidden xl:block">
          <div className="p-6 space-y-8">
            <section>
              <div className="eyebrow flex items-center gap-2 mb-4 text-ink-400">
                <Book size={14} />
                原著设定参考
              </div>
              <div className="space-y-3">
                <div className="bg-ink-50 dark:bg-ink-700/50 p-4 rounded-2xl border border-ink-100 dark:border-ink-600">
                  <h4 className="font-bold text-[10px] text-ink-800 dark:text-white mb-1 uppercase tracking-tighter text-accent-500">主线世界观</h4>
                  <h4 className="font-bold text-sm text-ink-800 dark:text-white mb-2">{originalStory?.title}</h4>
                  <p className="text-[10px] text-ink-500 leading-relaxed line-clamp-3">
                    {originalStory?.description}
                  </p>
                </div>
                
                {originalBranch && (
                  <div className="bg-purple-50 dark:bg-accent-500/10 p-4 rounded-2xl border border-accent-100 dark:border-purple-800 animate-in fade-in slide-in-from-left-4 duration-500">
                    <h4 className="font-bold text-[10px] text-accent-500 dark:text-purple-400 mb-1 uppercase tracking-tighter flex items-center gap-1">
                      <GitBranch size={12} />
                      时空分支设定
                    </h4>
                    <h4 className="font-bold text-sm text-ink-800 dark:text-white mb-2">{originalBranch.title}</h4>
                    <p className="text-[10px] text-purple-700 dark:text-purple-300 leading-relaxed line-clamp-4">
                      {originalBranch.description}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="eyebrow flex items-center gap-2 text-ink-400">
                  <Users size={14} />
                  引用角色
                </div>
                <span className="text-[10px] font-bold text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full">
                  {selectedCharIds.length}
                </span>
              </div>
              <div className="space-y-3">
                {characters.map(char => (
                  <div 
                    key={char.id}
                    onClick={() => toggleCharacter(char.id)}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedCharIds.includes(char.id)
                        ? 'border-accent-500 bg-accent-50 dark:bg-accent-800/20'
                        : 'border-transparent bg-ink-50 dark:bg-ink-700/50 hover:bg-ink-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-800/50 flex items-center justify-center text-accent-600 dark:text-accent-400 font-bold text-xs">
                        {char.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-ink-800 dark:text-white truncate">{char.name}</p>
                        <p className="text-[10px] text-ink-500 truncate capitalize">{char.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-accent-600 rounded-3xl p-6 text-white shadow-xl shadow-accent-500/20">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={20} />
                <h4 className="font-bold">创作准则</h4>
              </div>
              <p className="text-xs text-indigo-100 leading-relaxed">
                番外创作应尊重原著核心设定。如果你的番外被原作者认证，将获得 200% 的收益权重！
              </p>
            </section>
          </div>
        </aside>

        {/* Center: Editor Area */}
        <section className="flex-1 flex flex-col relative">
          {activeTab === 'editor' ? (
            <div className="p-6 h-full">
               <div className="max-w-4xl mx-auto h-full flex flex-col space-y-4">
                  <Input
                    type="text"
                    value={spinoff.title}
                    onChange={e => setSpinoff(prev => ({ ...prev, title: e.target.value }))}
                    wrapperClassName="w-full"
                    className="w-full h-auto bg-transparent border-0 text-3xl font-black text-ink-800 dark:text-white outline-none focus:ring-0 focus:border-transparent px-0 placeholder:text-ink-200"
                    placeholder="请输入番外标题..."
                  />
                  <div className="flex-1">
                    <ChapterEditor 
                      chapterId={id || 'new-spinoff'} 
                      storyId={spinoff.originalStoryId}
                      initialContent={spinoff.content || ''}
                      onSave={(content, meta) => {
                        setSpinoff(prev => ({ ...prev, content }));
                        return handleSave(content, meta);
                      }}
                    />
                  </div>
               </div>
            </div>
          ) : (
            <div className="p-12 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-12">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-ink-800 dark:text-white flex items-center gap-3">
                    <Layout className="text-accent-600" />
                    番外核心设定
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-ink-500 uppercase tracking-wider">番外类型</label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: 'biography', label: '人物传记', icon: Users, desc: '侧重角色背景' },
                          { id: 'if_timeline', label: 'IF 平行线', icon: History, desc: '另一种选择' },
                          { id: 'world_expansion', label: '世界补完', icon: Sparkles, desc: '扩充世界观' },
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setSpinoff(prev => ({ ...prev, type: t.id as any }))}
                            className={`p-4 rounded-3xl border-2 transition-all text-left space-y-2 ${
                              spinoff.type === t.id 
                                ? 'border-accent-600 bg-accent-50 dark:bg-accent-800/20' 
                                : 'border-ink-100 dark:border-ink-700 bg-ink-50 dark:bg-ink-800'
                            }`}
                          >
                            <t.icon size={20} className={spinoff.type === t.id ? 'text-accent-600' : 'text-ink-400'} />
                            <div className="font-semibold text-sm text-ink-800 dark:text-white">{t.label}</div>
                            <div className="text-[10px] text-ink-500 leading-tight">{t.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-ink-500 uppercase tracking-wider">短简介 (Summary)</label>
                      <Textarea
                        value={spinoff.summary}
                        onChange={e => setSpinoff(prev => ({ ...prev, summary: e.target.value }))}
                        rows={4}
                        className="px-6 py-4 border-ink-100 dark:border-ink-700 rounded-3xl focus:ring-accent-500 resize-none"
                        placeholder="简单描述一下番外的看点..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-8 rounded-[2.5rem] border border-amber-100 dark:border-amber-800 space-y-4">
                  <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                    <Info size={24} />
                    <h4 className="text-lg font-bold">关于版权与收益</h4>
                  </div>
                  <div className="space-y-3 text-sm text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                    <p>• 本番外默认向原著作者缴纳 10% 的版权授权费（从番外产生的阅读收益中自动扣除）。</p>
                    <p>• 原著作者有权将你的番外认证为“官方认证”，认证后作者将获得更高的曝光权重。</p>
                    <p>• 严禁发布任何违反原著作者意愿或包含违规内容的番外。</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SpinoffEditorPage;
