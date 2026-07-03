import React, { useState, useEffect } from 'react';
import { useSiteConfigStore, type SiteConfig } from '../../stores/useSiteConfigStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { storyService, Story } from '../../api/storyService';
import {
  Settings, Image, Megaphone, Layout, Palette, Globe, Save,
  Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Check, AlertCircle,
  Star, Search, X, GripVertical, BookOpen, FileText, Edit3
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '../../components/notifications';
import { Button, IconButton, Switch } from '../../components/ui';

type TabKey = 'basic' | 'banner' | 'announcement' | 'editor-picks' | 'footer' | 'seo' | 'pages';

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'basic', label: '基本信息', icon: <Settings size={16} /> },
  { key: 'banner', label: '轮播横幅', icon: <Image size={16} /> },
  { key: 'announcement', label: '公告栏', icon: <Megaphone size={16} /> },
  { key: 'editor-picks', label: '编辑推荐', icon: <Star size={16} /> },
  { key: 'footer', label: '页脚设置', icon: <Layout size={16} /> },
  { key: 'seo', label: '外观/SEO', icon: <Globe size={16} /> },
  { key: 'pages', label: '页面管理', icon: <FileText size={16} /> },
];

interface BannerSlide {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  badge: string;
}

export interface EditorPick {
  id: string;       // story id
  title: string;    // story title (snapshot)
  coverImage: string;
  author: string;
  description: string;
  comment: string;  // 编辑推荐语
  badge: string;    // 徽章文字, e.g. "主编力荐"
}

const CMSPage: React.FC = () => {
  const { config, fetchConfig, updateConfig } = useSiteConfigStore();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [form, setForm] = useState<Partial<SiteConfig>>({});
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([]);
  const [editorPicks, setEditorPicks] = useState<EditorPick[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // 编辑推荐搜索
  const [pickSearch, setPickSearch] = useState('');
  const [pickSearchResults, setPickSearchResults] = useState<Story[]>([]);
  const [pickSearchLoading, setPickSearchLoading] = useState(false);
  const [editingPickId, setEditingPickId] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    setForm({ ...config });
    try {
      const slides = JSON.parse(config.bannerSlides || '[]');
      setBannerSlides(Array.isArray(slides) ? slides : []);
    } catch {
      setBannerSlides([]);
    }
    try {
      const picks = JSON.parse(config.editorPicks || '[]');
      setEditorPicks(Array.isArray(picks) ? picks : []);
    } catch {
      setEditorPicks([]);
    }
  }, [config]);

  const handleChange = (key: keyof SiteConfig, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      addToast('warning', '请先登录后再进行此操作！');
      return;
    }
    setSaving(true);
    setSaveStatus('idle');
    try {
      const updates = {
        ...form,
        bannerSlides: JSON.stringify(bannerSlides),
        editorPicks: JSON.stringify(editorPicks),
      };
      await updateConfig(updates as Partial<SiteConfig>);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: unknown) {
      setSaveStatus('error');
      setErrorMsg(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 轮播管理
  const addSlide = () => {
    const newSlide: BannerSlide = {
      id: Date.now(),
      title: '新轮播标题',
      description: '副标题',
      imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=400&fit=crop',
      link: '/',
      badge: '新',
    };
    setBannerSlides(prev => [...prev, newSlide]);
  };

  const updateSlide = (index: number, field: keyof BannerSlide, value: string | number) => {
    setBannerSlides(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeSlide = (index: number) => {
    setBannerSlides(prev => prev.filter((_, i) => i !== index));
  };

  const moveSlide = (index: number, dir: 'up' | 'down') => {
    const next = [...bannerSlides];
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBannerSlides(next);
  };

  // 编辑推荐管理
  const searchPickStories = async (query: string) => {
    if (!query.trim()) { setPickSearchResults([]); return; }
    setPickSearchLoading(true);
    try {
      const all = await storyService.getAll();
      const q = query.toLowerCase();
      const filtered = all.filter((s: any) =>
        s.title.toLowerCase().includes(q) ||
        (s.author?.username || '').toLowerCase().includes(q)
      ).slice(0, 8);
      setPickSearchResults(filtered);
    } catch {
      setPickSearchResults([]);
    } finally {
      setPickSearchLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchPickStories(pickSearch), 300);
    return () => clearTimeout(timer);
  }, [pickSearch]);

  const addEditorPick = (story: Story) => {
    if (editorPicks.some(p => p.id === story.id)) return;
    const newPick: EditorPick = {
      id: story.id,
      title: story.title,
      coverImage: story.coverImage || '',
      author: story.author?.username || '',
      description: story.description || '',
      comment: '',
      badge: '主编力荐',
    };
    setEditorPicks(prev => [...prev, newPick]);
    setPickSearch('');
    setPickSearchResults([]);
    setEditingPickId(story.id);
  };

  const updatePick = (id: string, field: keyof EditorPick, value: string) => {
    setEditorPicks(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePick = (id: string) => {
    setEditorPicks(prev => prev.filter(p => p.id !== id));
    if (editingPickId === id) setEditingPickId(null);
  };

  const movePick = (index: number, dir: 'up' | 'down') => {
    const next = [...editorPicks];
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setEditorPicks(next);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-800 dark:text-white flex items-center gap-2">
            <Settings size={24} className="text-accent-500" />
            网站 CMS 管理
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">管理网站基本信息、轮播、公告等内容</p>
        </div>
        <Button
          onClick={handleSave}
          loading={saving}
          leftIcon={!saving ? <Save size={16} /> : undefined}
        >
          保存所有设置
        </Button>
      </div>

      {/* Save Status */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm font-medium">
          <Check size={16} />
          保存成功！设置已生效
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-44 shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeTab === tab.key
                    ? 'bg-accent-500 text-white shadow-lg shadow-accent-400/20'
                    : 'text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Panel */}
        <div className="flex-1 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-2xl p-6 space-y-6">

          {/* ===== 基本信息 ===== */}
          {activeTab === 'basic' && (
            <>
              <SectionTitle icon={<Settings size={18} />} title="基本信息" desc="设置网站名称、Logo 等基础信息" />

              {/* Logo 预览 */}
              <div className="flex items-center gap-6 p-4 bg-ink-50 dark:bg-ink-700 rounded-xl">
                <div className="w-16 h-16 rounded-xl bg-accent-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shrink-0">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    (form.siteName || '平')[0]
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold text-ink-800 dark:text-white">{form.siteName || '网站名称'}</p>
                  <p className="text-sm text-ink-500">{form.siteSlogan || '网站口号'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="网站名称" required>
                  <input
                    type="text"
                    value={form.siteName || ''}
                    onChange={e => handleChange('siteName', e.target.value)}
                    placeholder="平行宇宙"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="网站口号">
                  <input
                    type="text"
                    value={form.siteSlogan || ''}
                    onChange={e => handleChange('siteSlogan', e.target.value)}
                    placeholder="创作属于你的故事宇宙"
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField label="Logo 图片 URL" hint="建议尺寸 200×200px，PNG/SVG 格式，支持透明背景">
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={form.logoUrl || ''}
                    onChange={e => handleChange('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className={`${inputClass} flex-1`}
                  />
                  {form.logoUrl && (
                    <img src={form.logoUrl} alt="logo preview" className="w-10 h-10 rounded-lg object-contain border border-ink-200" onError={() => handleChange('logoUrl', '')} />
                  )}
                </div>
              </FormField>

              <FormField label="Favicon URL" hint="浏览器标签页图标，建议 32×32 ICO 或 PNG">
                <input
                  type="url"
                  value={form.faviconUrl || ''}
                  onChange={e => handleChange('faviconUrl', e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                  className={inputClass}
                />
              </FormField>

              <FormField label="联系邮箱">
                <input
                  type="email"
                  value={form.contactEmail || ''}
                  onChange={e => handleChange('contactEmail', e.target.value)}
                  placeholder="contact@example.com"
                  className={inputClass}
                />
              </FormField>
            </>
          )}

          {/* ===== 轮播横幅 ===== */}
          {activeTab === 'banner' && (
            <>
              <SectionTitle icon={<Image size={18} />} title="首页轮播横幅" desc="管理首页大轮播图，最多建议 5 张" />

              <div className="space-y-4">
                {bannerSlides.map((slide, i) => (
                  <div key={slide.id} className="border border-ink-200 dark:border-ink-600 rounded-xl overflow-hidden">
                    {/* 预览头部 */}
                    <div
                      className="relative h-24 bg-cover bg-center flex items-center px-6"
                      style={{ backgroundImage: `url(${slide.imageUrl})` }}
                    >
                      <div className="absolute inset-0 bg-black/50" />
                      <div className="relative z-10 flex-1">
                        <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full mr-2">{slide.badge}</span>
                        <span className="text-white font-bold text-sm">{slide.title}</span>
                        <p className="text-white/80 text-xs mt-0.5">{slide.description}</p>
                      </div>
                      <div className="relative z-10 flex items-center gap-2">
                        <button onClick={() => moveSlide(i, 'up')} disabled={i === 0} className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg disabled:opacity-30 transition-all">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => moveSlide(i, 'down')} disabled={i === bannerSlides.length - 1} className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg disabled:opacity-30 transition-all">
                          <ChevronDown size={14} />
                        </button>
                        <button onClick={() => removeSlide(i)} className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {/* 编辑表单 */}
                    <div className="p-4 grid grid-cols-2 gap-3 bg-ink-50 dark:bg-ink-700/50">
                      <FormField label="标题" compact>
                        <input type="text" value={slide.title} onChange={e => updateSlide(i, 'title', e.target.value)} className={inputSmClass} />
                      </FormField>
                      <FormField label="副标题" compact>
                        <input type="text" value={slide.description} onChange={e => updateSlide(i, 'description', e.target.value)} className={inputSmClass} />
                      </FormField>
                      <FormField label="标签文字" compact>
                        <input type="text" value={slide.badge} onChange={e => updateSlide(i, 'badge', e.target.value)} placeholder="热门" className={inputSmClass} />
                      </FormField>
                      <FormField label="跳转链接" compact>
                        <input type="text" value={slide.link} onChange={e => updateSlide(i, 'link', e.target.value)} placeholder="/" className={inputSmClass} />
                      </FormField>
                      <div className="col-span-2">
                        <FormField label="图片 URL" compact>
                          <input type="url" value={slide.imageUrl} onChange={e => updateSlide(i, 'imageUrl', e.target.value)} placeholder="https://..." className={inputSmClass} />
                        </FormField>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addSlide}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-ink-300 dark:border-ink-600 rounded-xl text-ink-500 hover:border-accent-400 hover:text-accent-500 transition-all font-semibold"
              >
                <Plus size={18} />
                添加轮播图
              </button>
            </>
          )}

          {/* ===== 公告栏 ===== */}
          {activeTab === 'announcement' && (
            <>
              <SectionTitle icon={<Megaphone size={18} />} title="公告栏" desc="首页顶部显示的公告信息" />

              <div className="flex items-center justify-between p-4 bg-ink-50 dark:bg-ink-700 rounded-xl">
                <div>
                  <p className="font-bold text-ink-800 dark:text-white text-sm">启用公告栏</p>
                  <p className="text-xs text-ink-500 mt-0.5">开启后，公告内容会显示在首页</p>
                </div>
                <Switch
                  checked={form.announcementEnabled === 'true'}
                  onChange={(v) => handleChange('announcementEnabled', v ? 'true' : 'false')}
                  aria-label="启用公告栏"
                />
              </div>

              <FormField label="公告内容" hint="显示在首页公告栏的文字内容">
                <textarea
                  value={form.announcement || ''}
                  onChange={e => handleChange('announcement', e.target.value)}
                  placeholder="输入公告内容，例如：新版本上线公告、活动通知等"
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </FormField>

              {/* 预览 */}
              {form.announcementEnabled === 'true' && form.announcement && (
                <div className="p-4 bg-accent-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-600 rounded-xl">
                  <p className="text-xs font-bold text-accent-500 dark:text-accent-400 mb-2">预览效果</p>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">新</span>
                    <span className="text-sm text-ink-600 dark:text-ink-300">{form.announcement}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== 编辑推荐 ===== */}
          {activeTab === 'editor-picks' && (
            <>
              <SectionTitle
                icon={<Star size={18} />}
                title="编辑推荐"
                desc={`管理首页「编辑推荐」区块，当前已选 ${editorPicks.length} 部作品`}
              />

              {/* 搜索添加 */}
              <div className="relative">
                <div className="flex items-center gap-2 px-4 py-3 bg-ink-50 dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus-within:border-accent-400 focus-within:ring-2 focus-within:ring-accent-400/20 transition-all">
                  <Search size={16} className="text-ink-400 shrink-0" />
                  <input
                    type="text"
                    value={pickSearch}
                    onChange={e => setPickSearch(e.target.value)}
                    placeholder="搜索故事名称或作者，选择后加入推荐列表..."
                    className="flex-1 bg-transparent text-sm text-ink-800 dark:text-white outline-none placeholder:text-ink-400"
                  />
                  {pickSearch && (
                    <button onClick={() => { setPickSearch(''); setPickSearchResults([]); }} className="text-ink-400 hover:text-ink-500 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* 搜索结果下拉 */}
                {(pickSearchResults.length > 0 || pickSearchLoading) && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-600 rounded-xl shadow-xl z-50 overflow-hidden">
                    {pickSearchLoading ? (
                      <div className="flex items-center justify-center py-6 text-sm text-ink-400">
                        <div className="w-4 h-4 border-2 border-ink-200 border-t-accent-400 rounded-full animate-spin mr-2" />
                        搜索中...
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto">
                        {pickSearchResults.map(story => {
                          const alreadyAdded = editorPicks.some(p => p.id === story.id);
                          return (
                            <button
                              key={story.id}
                              onClick={() => !alreadyAdded && addEditorPick(story)}
                              disabled={alreadyAdded}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                              <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-ink-100 dark:bg-ink-700">
                                <img
                                  src={story.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=80&h=112&fit=crop'}
                                  alt={story.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-ink-800 dark:text-white line-clamp-1">{story.title}</p>
                                <p className="text-xs text-ink-400 mt-0.5">{story.author?.username}</p>
                                <p className="text-xs text-ink-500 dark:text-ink-400 line-clamp-1 mt-0.5">{story.description}</p>
                              </div>
                              {alreadyAdded ? (
                                <span className="text-xs text-green-600 font-medium shrink-0">已添加</span>
                              ) : (
                                <span className="text-xs text-accent-500 font-medium shrink-0 flex items-center gap-1">
                                  <Plus size={12} /> 添加
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 提示 */}
              {editorPicks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                    <Star size={28} className="text-amber-500" />
                  </div>
                  <p className="text-sm font-bold text-ink-600 dark:text-ink-300 mb-1">还没有编辑推荐</p>
                  <p className="text-xs text-ink-400">通过上方搜索框添加想推荐给读者的故事</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {editorPicks.map((pick, i) => (
                    <div
                      key={pick.id}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        editingPickId === pick.id
                          ? 'border-accent-400 dark:border-accent-500 shadow-md shadow-accent-400/10'
                          : 'border-ink-200 dark:border-ink-600'
                      }`}
                    >
                      {/* 卡片头部 */}
                      <div className="flex items-center gap-4 p-4 bg-ink-50 dark:bg-ink-700/50">
                        {/* 序号 */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          i === 1 ? 'bg-ink-100 text-ink-500 dark:bg-ink-600 dark:text-ink-300' :
                          'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                        }`}>
                          {i + 1}
                        </div>

                        {/* 封面 */}
                        <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-ink-200 dark:bg-ink-600 shadow-sm">
                          <img
                            src={pick.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=80&h=112&fit=crop'}
                            alt={pick.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* 信息 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-ink-800 dark:text-white line-clamp-1">{pick.title}</p>
                          <p className="text-xs text-ink-400 mt-0.5">{pick.author}</p>
                          {pick.comment && (
                            <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 line-clamp-1 italic">「{pick.comment}」</p>
                          )}
                        </div>

                        {/* 操作 */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setEditingPickId(editingPickId === pick.id ? null : pick.id)}
                            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                              editingPickId === pick.id
                                ? 'bg-accent-100 text-accent-500 dark:bg-accent-500/15 dark:text-accent-400'
                                : 'bg-ink-100 text-ink-500 hover:bg-ink-200 dark:bg-ink-600 dark:text-ink-400 dark:hover:bg-ink-500'
                            }`}
                            title="编辑推荐语"
                          >
                            <BookOpen size={13} />
                          </button>
                          <button onClick={() => movePick(i, 'up')} disabled={i === 0} className="p-1.5 bg-ink-100 hover:bg-ink-200 dark:bg-ink-600 dark:hover:bg-ink-500 text-ink-500 dark:text-ink-400 rounded-lg disabled:opacity-30 transition-all">
                            <ChevronUp size={13} />
                          </button>
                          <button onClick={() => movePick(i, 'down')} disabled={i === editorPicks.length - 1} className="p-1.5 bg-ink-100 hover:bg-ink-200 dark:bg-ink-600 dark:hover:bg-ink-500 text-ink-500 dark:text-ink-400 rounded-lg disabled:opacity-30 transition-all">
                            <ChevronDown size={13} />
                          </button>
                          <button onClick={() => removePick(pick.id)} className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 rounded-lg transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* 展开编辑区 */}
                      {editingPickId === pick.id && (
                        <div className="p-4 border-t border-ink-200 dark:border-ink-600 space-y-3 bg-ink-50 dark:bg-ink-800">
                          <div className="grid grid-cols-2 gap-3">
                            <FormField label="徽章文字" compact hint="显示在封面左上角，如「主编力荐」「精品推荐」">
                              <input
                                type="text"
                                value={pick.badge}
                                onChange={e => updatePick(pick.id, 'badge', e.target.value)}
                                placeholder="主编力荐"
                                className={inputSmClass}
                              />
                            </FormField>
                            <FormField label="封面图 URL（可覆盖）" compact>
                              <input
                                type="url"
                                value={pick.coverImage}
                                onChange={e => updatePick(pick.id, 'coverImage', e.target.value)}
                                placeholder="留空使用原始封面"
                                className={inputSmClass}
                              />
                            </FormField>
                          </div>
                          <FormField label="编辑推荐语" compact hint="会显示在首页推荐卡片上，建议 20-50 字">
                            <textarea
                              value={pick.comment}
                              onChange={e => updatePick(pick.id, 'comment', e.target.value)}
                              placeholder="输入一段推荐语，吸引读者点击阅读..."
                              rows={3}
                              className={`${inputSmClass} resize-none`}
                            />
                          </FormField>
                          {/* 预览 */}
                          {pick.comment && (
                            <div className="p-3 bg-accent-50 dark:bg-accent-500/10 border border-accent-100 dark:border-accent-600 rounded-lg">
                              <p className="text-[10px] font-bold text-accent-400 uppercase tracking-wider mb-1">推荐语预览</p>
                              <p className="text-xs text-ink-500 dark:text-ink-400 italic leading-relaxed">「{pick.comment}」</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {editorPicks.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                  <GripVertical size={14} />
                  共 {editorPicks.length} 部推荐作品，首页将展示前 7 部（1 个主推 + 6 个副推）。修改后点击右上角「保存所有设置」生效。
                </div>
              )}
            </>
          )}

          {/* ===== 页脚 ===== */}
          {activeTab === 'footer' && (
            <>
              <SectionTitle icon={<Layout size={18} />} title="页脚设置" desc="网站底部版权、备案、社交媒体等信息" />

              <FormField label="版权文字">
                <input
                  type="text"
                  value={form.footerCopyright || ''}
                  onChange={e => handleChange('footerCopyright', e.target.value)}
                  placeholder="© 2026 平行宇宙故事平台. All rights reserved."
                  className={inputClass}
                />
              </FormField>

              <FormField label="ICP 备案号" hint="例如：京ICP备12345678号">
                <input
                  type="text"
                  value={form.icp || ''}
                  onChange={e => handleChange('icp', e.target.value)}
                  placeholder="苏ICP备xxxxxxxx号"
                  className={inputClass}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="微信公众号">
                  <input
                    type="text"
                    value={form.socialWeixin || ''}
                    onChange={e => handleChange('socialWeixin', e.target.value)}
                    placeholder="公众号名称或二维码链接"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="微博">
                  <input
                    type="text"
                    value={form.socialWeibo || ''}
                    onChange={e => handleChange('socialWeibo', e.target.value)}
                    placeholder="微博主页链接"
                    className={inputClass}
                  />
                </FormField>
              </div>
            </>
          )}

          {/* ===== 页面管理 ===== */}
          {activeTab === 'pages' && (
            <>
              <SectionTitle icon={<FileText size={18} />} title="页面内容管理" desc="编辑各页面的核心内容（支持 Markdown 格式）" />

              <PageEditor
                title="关于我们"
                fieldKey="pageAboutUs"
                value={form.pageAboutUs || ''}
                onChange={handleChange}
              />

              <PageEditor
                title="创作指南"
                fieldKey="pageCreationGuide"
                value={form.pageCreationGuide || ''}
                onChange={handleChange}
              />

              <PageEditor
                title="版权保护"
                fieldKey="pageCopyright"
                value={form.pageCopyright || ''}
                onChange={handleChange}
              />

              <PageEditor
                title="帮助中心"
                fieldKey="pageHelp"
                value={form.pageHelp || ''}
                onChange={handleChange}
              />
            </>
          )}

          {/* ===== 外观/SEO ===== */}
          {activeTab === 'seo' && (
            <>
              <SectionTitle icon={<Palette size={18} />} title="外观 & SEO" desc="网站主色调、搜索引擎相关设置" />

              <FormField label="主题色" hint="影响按钮、链接、高亮等元素颜色">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primaryColor || '#2563eb'}
                    onChange={e => handleChange('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded-lg border border-ink-200 dark:border-ink-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.primaryColor || '#2563eb'}
                    onChange={e => handleChange('primaryColor', e.target.value)}
                    placeholder="#2563eb"
                    className={`${inputClass} flex-1 font-mono`}
                  />
                  {/* 预设色板 */}
                  <div className="flex gap-1">
                    {['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#dc2626'].map(color => (
                      <button
                        key={color}
                        onClick={() => handleChange('primaryColor', color)}
                        className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: form.primaryColor === color ? '#000' : 'transparent',
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </FormField>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400">
                <p className="font-bold mb-1">💡 提示</p>
                <p>主题色修改后需要在代码中引用 CSS 变量生效，当前版本主要在 CMS 预览中展示。</p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

const PageEditor: React.FC<{
  title: string;
  fieldKey: keyof SiteConfig;
  value: string;
  onChange: (key: keyof SiteConfig, value: string) => void;
}> = ({ title, fieldKey, value, onChange }) => {
  const [preview, setPreview] = useState(false);

  return (
    <div className="space-y-3 p-5 bg-ink-50 dark:bg-ink-700/50 rounded-xl border border-ink-100 dark:border-ink-700">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-ink-800 dark:text-white">{title}</h4>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            preview
              ? 'bg-accent-100 dark:bg-accent-500/15 text-accent-500'
              : 'bg-ink-200 dark:bg-ink-600 text-ink-500 dark:text-ink-300 hover:bg-ink-300 dark:hover:bg-ink-500'
          }`}
        >
          {preview ? <Edit3 size={12} /> : <Eye size={12} />}
          {preview ? '编辑' : '预览'}
        </button>
      </div>
      {preview ? (
        <div className="prose prose-sm dark:prose-invert max-w-none min-h-[120px] p-4 bg-ink-50 dark:bg-ink-800 rounded-xl border border-ink-200 dark:border-ink-600">
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-ink-400 italic">暂未设置内容，将显示默认页面。</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          placeholder={`输入 ${title} 页面的 Markdown 内容...（留空则显示默认页面）`}
          rows={8}
          className="w-full px-4 py-3 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-600 rounded-xl text-sm text-ink-800 dark:text-white focus:ring-2 focus:ring-accent-400 outline-none transition-all resize-y font-mono"
        />
      )}
      <p className="text-xs text-ink-400">
        支持 Markdown 格式。留空则使用页面默认内容。
      </p>
    </div>
  );
};

// 辅助组件
const inputClass = 'w-full px-3 py-2.5 bg-ink-50 dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl text-sm text-ink-800 dark:text-white focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 outline-none transition-all';
const inputSmClass = 'w-full px-3 py-2 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-600 rounded-lg text-sm text-ink-800 dark:text-white focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 outline-none transition-all';

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex items-start gap-3 pb-4 border-b border-ink-100 dark:border-ink-700">
    <div className="p-2 bg-accent-50 dark:bg-accent-500/10 rounded-lg text-accent-500">{icon}</div>
    <div>
      <h3 className="font-bold text-ink-800 dark:text-white">{title}</h3>
      <p className="text-xs text-ink-500 mt-0.5">{desc}</p>
    </div>
  </div>
);

const FormField: React.FC<{
  label: string;
  hint?: string;
  required?: boolean;
  compact?: boolean;
  children: React.ReactNode;
}> = ({ label, hint, required, compact, children }) => (
  <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
    <label className={`block font-semibold text-ink-600 dark:text-ink-300 ${compact ? 'text-xs' : 'text-sm'}`}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-ink-400">{hint}</p>}
  </div>
);

export default CMSPage;
