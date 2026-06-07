import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWikiPages } from '../../hooks/useWiki';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  FileText, Filter, PlusCircle, Search, Sparkles,
  Users, Globe, BookOpen, Zap, Puzzle, Swords,
  Package, Clock, ChevronRight, Eye,
} from 'lucide-react';

const contentTypeIcons: Record<string, React.ReactNode> = {
  character: <Users size={16} />,
  setting: <Globe size={16} />,
  event: <Zap size={16} />,
  concept: <BookOpen size={16} />,
  faction: <Swords size={16} />,
  item: <Package size={16} />,
};

const contentTypeLabels: Record<string, string> = {
  character: '角色',
  setting: '设定',
  event: '事件',
  concept: '概念',
  faction: '势力',
  item: '物品',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  published: { label: '已发布', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  archived: { label: '已归档', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

const WikiListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [contentType, setContentType] = useState<string>('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useWikiPages({
    contentType: contentType || undefined,
    search: search || undefined,
    status: status || undefined,
    page: String(page),
    limit: '20',
  });

  // List endpoint returns { success, items, total, page, limit, totalPages }
  const pages = data?.items ?? data?.data ?? [];
  const pagination = {
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    total: data?.total ?? 0,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-ink-800 dark:text-white tracking-tight flex items-center gap-2">
          <Sparkles size={24} className="text-accent-500" />
          世界观百科
        </h1>
        {isAuthenticated && (
          <Link
            to="/wiki/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
          >
            <PlusCircle size={18} />
            创建百科页面
          </Link>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-ink-700/80 p-4 rounded-3xl border border-ink-100 dark:border-ink-600 shadow-sm sticky top-20 z-40 backdrop-blur-xl">
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => { setContentType(''); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              !contentType ? 'bg-indigo-500 text-white shadow-sm' : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-600'
            }`}
          >
            全部
          </button>
          {Object.entries(contentTypeLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setContentType(key); setPage(1); }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                contentType === key
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-600'
              }`}
            >
              {contentTypeIcons[key]}
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="搜索页面..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm font-medium"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-600 rounded-xl">
            <Filter size={16} className="text-ink-400" />
            <select
              className="bg-transparent text-sm font-bold text-ink-600 dark:text-ink-300 outline-none cursor-pointer"
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">全部状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
              <option value="archived">已归档</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
        </div>
      ) : pages.length === 0 ? (
        <div className="py-32 text-center bg-ink-50 dark:bg-ink-800/30 rounded-[3rem] border-2 border-dashed border-ink-200 dark:border-ink-700">
          <FileText size={64} className="mx-auto text-ink-300 mb-6" />
          <h3 className="text-2xl font-black text-ink-800 dark:text-white mb-2">百科尚未编撰</h3>
          <p className="text-ink-500 font-medium">还没有百科页面，快来创建第一个页面吧</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page: any) => (
              <div
                key={page.id}
                onClick={() => navigate(`/wiki/${page.id}`)}
                className="group bg-white dark:bg-ink-700 rounded-2xl border border-ink-100 dark:border-ink-600 p-6 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-600 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-ink-50 dark:bg-ink-800 rounded-xl text-xs font-bold text-ink-500">
                    {contentTypeIcons[page.contentType]}
                    {contentTypeLabels[page.contentType] || page.contentType}
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusLabels[page.status]?.color || ''}`}>
                    {statusLabels[page.status]?.label || page.status}
                  </span>
                </div>
                <h3 className="text-lg font-black text-ink-800 dark:text-white mb-2 group-hover:text-indigo-500 transition-colors">
                  {page.title}
                </h3>
                {page.summary && (
                  <p className="text-sm text-ink-500 line-clamp-2 mb-4">{page.summary}</p>
                )}
                <div className="flex items-center justify-between text-xs text-ink-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye size={13} />
                      v{page.version}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {new Date(page.updatedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-ink-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                    p === page
                      ? 'bg-indigo-500 text-white'
                      : 'bg-ink-50 dark:bg-ink-700 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WikiListPage;
