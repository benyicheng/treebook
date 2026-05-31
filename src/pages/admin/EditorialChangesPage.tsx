import React, { useEffect, useMemo, useState } from 'react';
import { editorialService, type EditorialChange, type EditorialChangeDetail } from '../../api/editorialService';

const parseJson = (s: string | null) => {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

const EditorialChangesPage: React.FC = () => {
  const [status, setStatus] = useState('submitted');
  const [targetType, setTargetType] = useState<string>('');
  const [changes, setChanges] = useState<EditorialChange[]>([]);
  const [selected, setSelected] = useState<EditorialChangeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const loadList = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await editorialService.listChanges({ status, targetType: targetType || undefined, limit: 50, offset: 0 });
      setChanges(rows);
    } catch (e: any) {
      setError(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadList();
    setSelected(null);
  }, [status, targetType]);

  const loadDetail = async (id: string) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const d = await editorialService.getChangeById(id);
      setSelected(d);
    } catch (e: any) {
      setError(e?.message || '加载失败');
    } finally {
      setLoadingDetail(false);
    }
  };

  const apply = async () => {
    if (!selected) return;
    setActing(true);
    setError(null);
    try {
      await editorialService.applyChange(selected.id);
      await loadDetail(selected.id);
      await loadList();
    } catch (e: any) {
      setError(e?.message || '应用失败');
    } finally {
      setActing(false);
    }
  };

  const actionPayloads = useMemo(() => {
    if (!selected) return [];
    return (selected.actions || []).map((a) => ({ ...a, parsed: parseJson(a.payload) }));
  }, [selected]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-ink-800 dark:text-white">编辑改稿</h1>
          <p className="text-sm text-ink-400 mt-2">以变更单方式提交/应用改稿，自动留痕并触发退回工单重提与机审</p>
        </div>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 text-sm"
          >
            <option value="submitted">待应用</option>
            <option value="draft">草稿</option>
            <option value="applied">已应用</option>
            <option value="rejected">已拒绝</option>
          </select>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="px-4 py-2 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 text-sm"
          >
            <option value="">全部类型</option>
            <option value="story">story</option>
            <option value="chapter">chapter</option>
            <option value="spinoff">spinoff</option>
            <option value="booklist">booklist</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-ink-100 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100 dark:border-ink-700 flex items-center justify-between">
            <div className="text-sm font-black text-ink-800 dark:text-white">变更单列表</div>
            <div className="text-xs text-ink-400">{loading ? '加载中…' : `${changes.length} 条`}</div>
          </div>
          <div className="divide-y divide-ink-100 dark:divide-ink-700">
            {changes.map((c) => (
              <button
                key={c.id}
                onClick={() => void loadDetail(c.id)}
                className={`w-full text-left px-5 py-4 hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors ${
                  selected?.id === c.id ? 'bg-ink-50 dark:bg-ink-700' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-black text-ink-800 dark:text-white truncate">
                      {c.targetType} · {c.field}
                    </div>
                    <div className="text-xs text-ink-400 truncate">{c.targetId}</div>
                  </div>
                  <div className="text-[10px] text-ink-400 shrink-0">{new Date(c.updatedAt).toLocaleString()}</div>
                </div>
              </button>
            ))}
            {!loading && changes.length === 0 && (
              <div className="px-5 py-10 text-sm text-ink-400 text-center">暂无数据</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100 dark:border-ink-700 flex items-center justify-between">
            <div className="text-sm font-black text-ink-800 dark:text-white">变更单详情</div>
            <div className="text-xs text-ink-400">{loadingDetail ? '加载中…' : selected ? selected.status : ''}</div>
          </div>

          {!selected && (
            <div className="px-5 py-10 text-sm text-ink-400 text-center">选择左侧变更单查看详情</div>
          )}

          {selected && (
            <div className="p-5 space-y-4">
              <div className="text-xs text-ink-400 space-y-1">
                <div>target：{selected.targetType} / {selected.targetId}</div>
                <div>field：{selected.field}</div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-xl border border-ink-100 dark:border-ink-700 p-4">
                  <div className="text-xs font-black text-ink-500 mb-2">原文</div>
                  <pre className="text-xs whitespace-pre-wrap break-words text-ink-600 dark:text-ink-200">{selected.original || ''}</pre>
                </div>
                <div className="rounded-xl border border-ink-100 dark:border-ink-700 p-4">
                  <div className="text-xs font-black text-ink-500 mb-2">改稿后</div>
                  <pre className="text-xs whitespace-pre-wrap break-words text-ink-600 dark:text-ink-200">{selected.proposed || ''}</pre>
                </div>
              </div>

              <div className="rounded-xl border border-ink-100 dark:border-ink-700 p-4">
                <div className="text-xs font-black text-ink-500 mb-2">动作留痕</div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {actionPayloads.map((a: any) => (
                    <div key={a.id} className="text-xs">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-ink-600 dark:text-ink-200">{a.action}</div>
                        <div className="text-ink-400">{new Date(a.createdAt).toLocaleString()}</div>
                      </div>
                      {a.payload && (
                        <pre className="mt-1 text-[11px] whitespace-pre-wrap break-words text-ink-500">
                          {a.parsed ? JSON.stringify(a.parsed, null, 2) : a.payload}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={acting || selected.status !== 'submitted'}
                  onClick={() => void apply()}
                  className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-black disabled:opacity-50"
                >
                  应用改稿
                </button>
              </div>
              {selected.status !== 'submitted' && (
                <div className="text-xs text-ink-400">仅 submitted 状态可应用改稿</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorialChangesPage;

