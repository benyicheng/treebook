import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useWikiPage, useDeleteWikiPage, useAddWikiAlias, useRemoveWikiAlias, useCreateWikiLink, useRemoveWikiLink } from '../../hooks/useWiki';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToast } from '../../components/notifications';
import { Modal } from '../../components/ui';
import {
  ArrowLeft, Edit3, Trash2, Plus, X, Link2, Hash,
  FileText, Users, Globe, BookOpen, Zap, Puzzle,
  Swords, Package, Clock, Eye, AlertCircle,
} from 'lucide-react';

const contentTypeLabels: Record<string, string> = {
  character: '角色',
  setting: '设定',
  event: '事件',
  concept: '概念',
  faction: '势力',
  item: '物品',
};

const linkTypeLabels: Record<string, string> = {
  reference: '引用',
  see_also: '参见',
  parent: '上级',
  child: '下级',
  related: '相关',
};

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

const WikiDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToast();

  const { data, isLoading } = useWikiPage(id);
  const deleteWikiPage = useDeleteWikiPage();
  const addAlias = useAddWikiAlias(id!);
  const removeAlias = useRemoveWikiAlias(id!);
  const createLink = useCreateWikiLink(id!);
  const removeLink = useRemoveWikiLink(id!);

  const page = data?.data ?? data;

  // Alias state
  const [aliasInput, setAliasInput] = useState('');
  const [aliasLanguage, setAliasLanguage] = useState('');

  // Link state
  const [linkTargetId, setLinkTargetId] = useState('');
  const [linkType, setLinkType] = useState('reference');

  // Delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCreator = user && page && user.id === page.createdBy;

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteWikiPage.mutateAsync(id);
      addToast('success', '页面已删除');
      navigate('/wiki');
    } catch {
      addToast('error', '删除失败');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleAddAlias = async () => {
    if (!aliasInput.trim()) return;
    try {
      await addAlias.mutateAsync({ alias: aliasInput.trim(), language: aliasLanguage || undefined });
      setAliasInput('');
      setAliasLanguage('');
      addToast('success', '别名已添加');
    } catch {
      addToast('error', '添加别名失败');
    }
  };

  const handleRemoveAlias = async (aliasId: string) => {
    try {
      await removeAlias.mutateAsync(aliasId);
    } catch {
      addToast('error', '删除别名失败');
    }
  };

  const handleCreateLink = async () => {
    if (!linkTargetId.trim()) return;
    try {
      await createLink.mutateAsync({ targetPageId: linkTargetId.trim(), linkType });
      setLinkTargetId('');
      setLinkType('reference');
      addToast('success', '链接已创建');
    } catch {
      addToast('error', '创建链接失败');
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    try {
      await removeLink.mutateAsync(linkId);
    } catch {
      addToast('error', '删除链接失败');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <AlertCircle size={48} className="mx-auto text-ink-300 mb-4" />
        <h2 className="text-2xl font-black text-ink-800 dark:text-white mb-2">页面未找到</h2>
        <button onClick={() => navigate('/wiki')} className="mt-6 px-6 py-2.5 bg-ink-100 dark:bg-ink-700 rounded-xl font-bold hover:bg-ink-200 dark:hover:bg-ink-600 transition-colors">
          返回百科
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/wiki')} className="flex items-center gap-2 px-4 py-2 bg-ink-50 dark:bg-ink-700 rounded-xl text-sm font-bold text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-600 transition-colors">
          <ArrowLeft size={16} />
          返回百科
        </button>
        {isCreator && (
          <div className="flex items-center gap-2">
            <Link
              to={`/wiki/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-black hover:bg-indigo-600 transition-colors"
            >
              <Edit3 size={16} />
              编辑
            </Link>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-black hover:bg-red-600 transition-colors"
            >
              <Trash2 size={16} />
              删除
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-8 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-ink-50 dark:bg-ink-800 rounded-xl text-xs font-bold text-ink-500">
                {page.contentType && contentTypeLabels[page.contentType]
                  ? contentTypeLabels[page.contentType]
                  : page.contentType}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                page.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                page.status === 'draft' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {statusLabels[page.status] || page.status}
              </span>
            </div>
            <h1 className="text-4xl font-black text-ink-800 dark:text-white">{page.title}</h1>
            {page.slug && (
              <p className="text-sm text-ink-400 mt-1 font-mono">/wiki/{page.slug}</p>
            )}
          </div>
          <div className="text-right text-xs text-ink-400 space-y-1">
            <p className="flex items-center gap-1 justify-end"><Clock size={13} />更新于 {new Date(page.updatedAt).toLocaleString('zh-CN')}</p>
            <p className="flex items-center gap-1 justify-end"><Eye size={13} />版本 v{page.version}</p>
            {page.story && <p className="text-indigo-500 font-bold">所属故事：{page.story.title}</p>}
          </div>
        </div>

        {page.summary && (
          <p className="text-ink-500 italic border-l-4 border-indigo-300 pl-4 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-r-xl">
            {page.summary}
          </p>
        )}

        {page.attributes && Object.keys(page.attributes).length > 0 && (
          <div className="bg-ink-50 dark:bg-ink-800 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2">属性</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(page.attributes).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1.5 text-sm">
                  <span className="font-bold text-ink-500">{key}:</span>
                  <span className="text-ink-600 dark:text-ink-300">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-8">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown>{page.content || '*暂无内容*'}</ReactMarkdown>
        </div>
      </div>

      {/* Aliases */}
      <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-6 space-y-4">
        <h2 className="text-lg font-black text-ink-800 dark:text-white flex items-center gap-2">
          <Hash size={20} className="text-indigo-400" />
          别名
        </h2>
        {page.aliases?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {page.aliases.map((alias: any) => (
              <span key={alias.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-medium">
                {alias.alias}
                {alias.language && <span className="text-[10px] text-indigo-400">({alias.language})</span>}
                {isCreator && (
                  <button onClick={() => handleRemoveAlias(alias.id)} className="hover:text-red-500 transition-colors ml-1">
                    <X size={14} />
                  </button>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400">暂无别名</p>
        )}
        {isCreator && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="添加别名..."
              className="flex-1 px-4 py-2 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              value={aliasInput}
              onChange={e => setAliasInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddAlias()}
            />
            <input
              type="text"
              placeholder="语言"
              className="w-20 px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 outline-none text-xs"
              value={aliasLanguage}
              onChange={e => setAliasLanguage(e.target.value)}
            />
            <button
              onClick={handleAddAlias}
              disabled={addAlias.isPending || !aliasInput.trim()}
              className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Outgoing links */}
        <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-6 space-y-4">
          <h2 className="text-lg font-black text-ink-800 dark:text-white flex items-center gap-2">
            <Link2 size={20} className="text-indigo-400" />
            链接到此页的页面
          </h2>
          {page.outgoingLinks?.length > 0 ? (
            <div className="space-y-2">
              {page.outgoingLinks.map((link: any) => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-ink-50 dark:bg-ink-800 rounded-xl">
                  <div>
                    <Link to={`/wiki/${link.targetPage?.id || link.targetPageId}`} className="font-bold text-indigo-500 hover:text-indigo-600 text-sm">
                      {link.targetPage?.title || link.targetPageId}
                    </Link>
                    <span className="ml-2 text-[10px] text-ink-400 bg-ink-100 dark:bg-ink-700 px-1.5 py-0.5 rounded">
                      {linkTypeLabels[link.linkType] || link.linkType}
                    </span>
                  </div>
                  {isCreator && (
                    <button onClick={() => handleRemoveLink(link.id)} className="text-ink-300 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400">暂无链接</p>
          )}
        </div>

        {/* Incoming links */}
        <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-6 space-y-4">
          <h2 className="text-lg font-black text-ink-800 dark:text-white flex items-center gap-2">
            <Link2 size={20} className="text-indigo-400" />
            被链接到此页的页面
          </h2>
          {page.incomingLinks?.length > 0 ? (
            <div className="space-y-2">
              {page.incomingLinks.map((link: any) => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-ink-50 dark:bg-ink-800 rounded-xl">
                  <Link to={`/wiki/${link.sourcePage?.id || link.sourcePageId}`} className="font-bold text-indigo-500 hover:text-indigo-600 text-sm">
                    {link.sourcePage?.title || link.sourcePageId}
                  </Link>
                  <span className="text-[10px] text-ink-400 bg-ink-100 dark:bg-ink-700 px-1.5 py-0.5 rounded">
                    {linkTypeLabels[link.linkType] || link.linkType}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400">暂无被链接</p>
          )}
        </div>
      </div>

      {/* Add Link (creator only) */}
      {isCreator && (
        <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-6 space-y-4">
          <h2 className="text-lg font-black text-ink-800 dark:text-white flex items-center gap-2">
            <Plus size={20} className="text-indigo-400" />
            创建链接
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="目标页面 ID..."
              className="flex-1 px-4 py-2 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              value={linkTargetId}
              onChange={e => setLinkTargetId(e.target.value)}
            />
            <select
              className="px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 outline-none text-sm font-bold"
              value={linkType}
              onChange={e => setLinkType(e.target.value)}
            >
              {Object.entries(linkTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button
              onClick={handleCreateLink}
              disabled={createLink.isPending || !linkTargetId.trim()}
              className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              添加
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="确认删除">
        <p className="text-ink-500 mb-6">删除后无法恢复，确定要删除「{page.title}」吗？</p>
        <div className="flex gap-3">
          <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 bg-ink-100 dark:bg-ink-700 rounded-xl font-bold hover:bg-ink-200 dark:hover:bg-ink-600 transition-colors">
            取消
          </button>
          <button onClick={handleDelete} disabled={isDeleting}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black hover:bg-red-600 disabled:opacity-50 transition-colors">
            {isDeleting ? '删除中...' : '确认删除'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default WikiDetailPage;
