import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWikiPage, useCreateWikiPage, useUpdateWikiPage } from '../../hooks/useWiki';
import { useStories } from '../../hooks/useStories';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToast } from '../../components/notifications';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { MarkdownEditor } from '../../components/Editor';
import { Button, Input, Textarea, Select } from '../../components/ui';

const contentTypes = [
  { value: 'character', label: '角色', icon: '👤' },
  { value: 'setting', label: '设定', icon: '🌍' },
  { value: 'event', label: '事件', icon: '⚡' },
  { value: 'concept', label: '概念', icon: '📖' },
  { value: 'faction', label: '势力', icon: '⚔️' },
  { value: 'item', label: '物品', icon: '📦' },
];

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '发布' },
  { value: 'archived', label: '归档' },
];

const WikiEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const isEditMode = !!id;

  // Existing page data (edit mode)
  const { data: existingData } = useWikiPage(id);
  const existingPage = existingData?.data ?? existingData;

  const createWikiPage = useCreateWikiPage();
  const updateWikiPage = useUpdateWikiPage(id!);

  // Stories list for selection
  const { data: storiesData } = useStories({});
  const stories = storiesData?.data ?? storiesData ?? [];

  const [form, setForm] = useState({
    title: '',
    slug: '',
    contentType: 'concept',
    content: '',
    summary: '',
    status: 'draft',
    storyId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form in edit mode
  useEffect(() => {
    if (existingPage) {
      setForm({
        title: existingPage.title || '',
        slug: existingPage.slug || '',
        contentType: existingPage.contentType || 'concept',
        content: existingPage.content || '',
        summary: existingPage.summary || '',
        status: existingPage.status || 'draft',
        storyId: existingPage.storyId || '',
      });
    }
  }, [existingPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('warning', '请先登录');
      return;
    }
    if (!form.title.trim()) {
      addToast('warning', '请输入标题');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        storyId: form.storyId || undefined,
        summary: form.summary || undefined,
        slug: form.slug || undefined,
      };

      if (isEditMode && id) {
        await updateWikiPage.mutateAsync(payload as any);
        addToast('success', '页面已更新');
        navigate(`/wiki/${id}`);
      } else {
        const result = await createWikiPage.mutateAsync(payload as any);
        addToast('success', '页面已创建');
        navigate(`/wiki/${result.data?.id || result.id}`);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || (isEditMode ? '更新失败' : '创建失败');
      addToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setForm(prev => ({
      ...prev,
      title,
      slug: isEditMode ? prev.slug : title
        .toLowerCase()
        .replace(/[\u4e00-\u9fff]+/g, '-')   // 中文字符 → 连字符
        .replace(/[^a-z0-9_-]/g, '')          // 只保留后端允许的字符
        .replace(/-+/g, '-')                  // 合并连续连字符
        .replace(/^-+|-+$/g, '')              // 去掉首尾连字符
        .slice(0, 100) || 'untitled',
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="subtle" onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} />}>返回</Button>
        <h1 className="text-2xl font-bold text-ink-800 dark:text-white">
          {isEditMode ? '编辑百科页面' : '创建百科页面'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title & Slug */}
        <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink-500">标题 *</label>
            <Input
              type="text"
              required
              className="rounded-2xl h-auto py-4 font-bold text-xl"
              placeholder="页面的标题"
              value={form.title}
              onChange={e => handleTitleChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink-500">URL 标识 (slug)</label>
            <Input
              type="text"
              className="rounded-2xl h-auto py-3 font-mono text-sm"
              placeholder="page-url-slug"
              value={form.slug}
              onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
            />
            <p className="text-xs text-ink-400">留空则自动生成</p>
          </div>
        </div>

        {/* Content Type */}
        <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-8 space-y-4">
          <label className="text-sm font-semibold text-ink-500">内容类型</label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {contentTypes.map(ct => (
              <button
                key={ct.value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, contentType: ct.value }))}
                className={`p-4 rounded-2xl border-2 text-center transition-all ${
                  form.contentType === ct.value
                    ? 'border-accent-400 bg-accent-50 dark:bg-accent-500/10 shadow-lg shadow-accent-400/10'
                    : 'border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 hover:border-accent-200 dark:hover:border-accent-600'
                }`}
              >
                <div className="text-2xl mb-1">{ct.icon}</div>
                <div className={`text-xs font-bold ${
                  form.contentType === ct.value ? 'text-accent-600 dark:text-accent-400' : 'text-ink-500'
                }`}>
                  {ct.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Story association */}
        <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-8 space-y-4">
          <label className="text-sm font-semibold text-ink-500">关联故事（可选）</label>
          <Select
            className="rounded-2xl h-auto py-4 font-semibold"
            value={form.storyId}
            onChange={e => setForm(prev => ({ ...prev, storyId: e.target.value }))}
          >
            <option value="">不关联故事（全局百科）</option>
            {(Array.isArray(stories) ? stories : []).map((s: any) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </Select>
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-8 space-y-4">
          <label className="text-sm font-semibold text-ink-500">摘要</label>
          <Textarea
            rows={3}
            className="resize-none"
            placeholder="简短的页面摘要..."
            value={form.summary}
            onChange={e => setForm(prev => ({ ...prev, summary: e.target.value }))}
          />
        </div>

        {/* Content (Markdown) */}
        <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-8 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-ink-500">内容（支持 Markdown）</label>
            <div className="flex items-center gap-1 text-xs text-ink-400">
              <Sparkles size={12} />
              Markdown
            </div>
          </div>
          <MarkdownEditor
            value={form.content}
            onChange={(content) => setForm(prev => ({ ...prev, content }))}
            enableMedia
            mediaContext="wiki_inline"
            className="h-[560px]"
            placeholder="在此编写百科内容…支持 Markdown 与 [[实体名称]] 关联。"
          />
        </div>

        {/* Status */}
        <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-8 space-y-4">
          <label className="text-sm font-semibold text-ink-500">状态</label>
          <div className="flex gap-3">
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, status: opt.value }))}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                  form.status === opt.value
                    ? 'bg-accent-500 text-white shadow-sm'
                    : 'bg-ink-50 dark:bg-ink-800 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          loading={isSubmitting}
          fullWidth
          leftIcon={<Save size={24} />}
          className="rounded-[2rem] h-auto py-5 text-xl font-bold shadow-xl shadow-accent-400/20"
        >
          {isSubmitting ? '保存中...' : isEditMode ? '保存修改' : '创建页面'}
        </Button>
      </form>
    </div>
  );
};

export default WikiEditorPage;
