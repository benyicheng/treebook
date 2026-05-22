import React, { useEffect, useMemo, useState } from 'react';
import { reviewWorkflowService, type ReviewCase, type ReviewCaseDetail } from '../../api/reviewWorkflowService';

const parseJson = (s: string | null) => {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

const ReviewCasesPage: React.FC = () => {
  const [status, setStatus] = useState('open');
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [selected, setSelected] = useState<ReviewCaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    reviewWorkflowService
      .listCases({ status, limit: 50, offset: 0 })
      .then((rows) => {
        if (mounted) setCases(rows);
      })
      .catch((e) => {
        if (mounted) setError(e?.message || '加载失败');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [status]);

  const loadDetail = async (id: string) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const d = await reviewWorkflowService.getCaseById(id);
      setSelected(d);
      setActionNote('');
    } catch (e: any) {
      setError(e?.message || '加载失败');
    } finally {
      setLoadingDetail(false);
    }
  };

  const submitAction = async (action: 'approve' | 'reject' | 'return') => {
    if (!selected) return;
    setActing(true);
    setError(null);
    try {
      const note = actionNote.trim();
      const payload = note ? { reasons: [note] } : {};
      await reviewWorkflowService.addAction(selected.id, { action, payload });
      await loadDetail(selected.id);
      const rows = await reviewWorkflowService.listCases({ status, limit: 50, offset: 0 });
      setCases(rows);
    } catch (e: any) {
      setError(e?.message || '提交失败');
    } finally {
      setActing(false);
    }
  };

  const snapshot = useMemo(() => parseJson(selected?.snapshot || null), [selected?.snapshot]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">人工复核工单</h1>
          <p className="text-sm text-gray-400 mt-2">机审拒绝/失败自动生成待办，人工复核可覆盖机审裁决并留痕</p>
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setSelected(null);
          }}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
        >
          <option value="open">待处理</option>
          <option value="in_review">处理中</option>
          <option value="returned">已退回</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
          <option value="closed">已关闭</option>
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="text-sm font-black text-gray-900 dark:text-white">工单列表</div>
            <div className="text-xs text-gray-400">{loading ? '加载中…' : `${cases.length} 条`}</div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => void loadDetail(c.id)}
                className={`w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selected?.id === c.id ? 'bg-gray-50 dark:bg-gray-800' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-black text-gray-900 dark:text-white truncate">
                      L{c.level} · {c.targetType} · {c.contentType}{c.field ? ` · ${c.field}` : ''}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{c.targetId}</div>
                  </div>
                  <div className="text-[10px] text-gray-400 shrink-0">
                    {c.dueAt ? `SLA ${new Date(c.dueAt).toLocaleString()}` : new Date(c.updatedAt).toLocaleString()}
                  </div>
                </div>
              </button>
            ))}
            {!loading && cases.length === 0 && (
              <div className="px-5 py-10 text-sm text-gray-400 text-center">暂无数据</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="text-sm font-black text-gray-900 dark:text-white">工单详情</div>
            <div className="text-xs text-gray-400">{loadingDetail ? '加载中…' : selected ? selected.status : ''}</div>
          </div>

          {!selected && (
            <div className="px-5 py-10 text-sm text-gray-400 text-center">选择左侧工单查看详情</div>
          )}

          {selected && (
            <div className="p-5 space-y-4">
              <div className="text-xs text-gray-400 space-y-1">
                <div>businessLine：{selected.businessLine}</div>
                <div>target：{selected.targetType} / {selected.targetId}</div>
                <div>content：{selected.contentType}{selected.field ? ` / ${selected.field}` : ''}</div>
                <div>level：L{selected.level}{typeof selected.reopenedCount === 'number' ? ` · reopened ${selected.reopenedCount}` : ''}{selected.dueAt ? ` · due ${new Date(selected.dueAt).toLocaleString()}` : ''}</div>
              </div>

              <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="text-xs font-black text-gray-500 mb-2">内容快照</div>
                <pre className="text-xs whitespace-pre-wrap break-words text-gray-700 dark:text-gray-200">{snapshot ? JSON.stringify(snapshot, null, 2) : (selected.snapshot || '')}</pre>
              </div>

              <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="text-xs font-black text-gray-500 mb-2">操作日志</div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(selected.actions || []).map((a) => (
                    <div key={a.id} className="text-xs">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-700 dark:text-gray-200">{a.action}</div>
                        <div className="text-gray-400">{new Date(a.createdAt).toLocaleString()}</div>
                      </div>
                      {a.payload && (
                        <pre className="mt-1 text-[11px] whitespace-pre-wrap break-words text-gray-500">{a.payload}</pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-black text-gray-500">备注（退回/拒绝原因或通过说明）</div>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="w-full min-h-24 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  placeholder="输入备注…"
                />
                <div className="flex gap-2">
                  <button
                    disabled={acting}
                    onClick={() => void submitAction('approve')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black disabled:opacity-50"
                  >
                    通过
                  </button>
                  <button
                    disabled={acting}
                    onClick={() => void submitAction('reject')}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-black disabled:opacity-50"
                  >
                    拒绝
                  </button>
                  <button
                    disabled={acting}
                    onClick={() => void submitAction('return')}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-black disabled:opacity-50"
                  >
                    退回修改
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCasesPage;
