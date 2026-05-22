import React, { useEffect, useMemo, useState } from 'react';
import { moderationService, type ModerationMetrics, type ModerationDecision } from '../../api/moderationService';

const StatCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
    <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">{title}</div>
    <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{value}</div>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    failed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  const labels: Record<string, string> = {
    approved: '已通过',
    rejected: '已拒绝',
    pending: '待审核',
    failed: '失败',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status] || colors.failed}`}>
      {labels[status] || status}
    </span>
  );
};

const ModerationDashboard: React.FC = () => {
  const [sinceMinutes, setSinceMinutes] = useState(1440);
  const [metrics, setMetrics] = useState<ModerationMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 审核决策列表状态
  const [decisions, setDecisions] = useState<ModerationDecision[]>([]);
  const [decisionsLoading, setDecisionsLoading] = useState(false);
  const [decisionsFilter, setDecisionsFilter] = useState<{ status?: string; targetType?: string }>({});
  const [decisionsPage, setDecisionsPage] = useState(0);
  const decisionsLimit = 20;

  // 手动审核弹窗状态
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    targetType: 'story',
    targetId: '',
    status: 'approved' as 'approved' | 'rejected',
    labels: '',
    reasons: '',
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // 加载统计指标
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    moderationService.getMetrics(sinceMinutes)
      .then((m) => { if (mounted) setMetrics(m); })
      .catch((e) => { if (mounted) setError(e?.message || '加载失败'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [sinceMinutes]);

  // 加载审核决策列表
  const loadDecisions = async (page = 0) => {
    setDecisionsLoading(true);
    setError(null);
    try {
      const data = await moderationService.listDecisions({
        ...decisionsFilter,
        limit: decisionsLimit,
        offset: page * decisionsLimit,
      });
      setDecisions(data || []);
      setDecisionsPage(page);
    } catch (e: any) {
      setError(e?.message || '加载审核决策失败');
    } finally {
      setDecisionsLoading(false);
    }
  };

  useEffect(() => {
    loadDecisions(0);
  }, [decisionsFilter.status, decisionsFilter.targetType]);

  const total = useMemo(() => {
    if (!metrics) return 0;
    return (metrics.byStatus || []).reduce((s, r: any) => s + Number(r.count || 0), 0);
  }, [metrics]);

  const rejected = useMemo(() => {
    if (!metrics) return 0;
    const row = (metrics.byStatus || []).find((r: any) => r.status === 'rejected');
    return Number(row?.count || 0);
  }, [metrics]);

  // 提交手动审核
  const submitManualDecision = async () => {
    if (!manualForm.targetId.trim()) {
      setError('请输入目标ID');
      return;
    }
    setManualSubmitting(true);
    setError(null);
    try {
      await moderationService.manualDecision({
        targetType: manualForm.targetType,
        targetId: manualForm.targetId.trim(),
        status: manualForm.status,
        labels: manualForm.labels.split(',').map(s => s.trim()).filter(Boolean),
        reasons: manualForm.reasons.split('\n').map(s => s.trim()).filter(Boolean),
      });
      setManualModalOpen(false);
      setManualForm({ targetType: 'story', targetId: '', status: 'approved', labels: '', reasons: '' });
      // 刷新列表和统计
      loadDecisions(decisionsPage);
      moderationService.getMetrics(sinceMinutes).then(setMetrics);
    } catch (e: any) {
      setError(e?.message || '提交失败');
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">内容审核仪表盘</h1>
          <p className="text-sm text-gray-400 mt-2">聚合审核结果与来源分布</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setManualModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
          >
            + 手动审核
          </button>
          <select
            value={sinceMinutes}
            onChange={(e) => setSinceMinutes(Number(e.target.value))}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
          >
            <option value={60}>近 1 小时</option>
            <option value={360}>近 6 小时</option>
            <option value={1440}>近 24 小时</option>
            <option value={10080}>近 7 天</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="总审核数" value={loading ? '加载中' : total.toLocaleString()} />
        <StatCard title="拒绝数" value={loading ? '加载中' : rejected.toLocaleString()} />
        <StatCard title="时间窗口" value={loading ? '加载中' : `${sinceMinutes} 分钟`} />
      </div>

      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">按状态</h2>
            <div className="space-y-2">
              {(metrics.byStatus || []).map((r: any) => (
                <div key={r.status} className="flex items-center justify-between text-sm">
                  <div className="text-gray-600 dark:text-gray-300">{r.status}</div>
                  <div className="font-bold text-gray-900 dark:text-white">{Number(r.count || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">按提供方</h2>
            <div className="space-y-2">
              {(metrics.byProvider || []).map((r: any) => (
                <div key={r.provider} className="flex items-center justify-between text-sm">
                  <div className="text-gray-600 dark:text-gray-300">{r.provider}</div>
                  <div className="font-bold text-gray-900 dark:text-white">{Number(r.count || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 lg:col-span-2">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">按业务对象</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(metrics.byTargetType || []).map((r: any) => (
                <div key={r.targetType} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">{r.targetType}</div>
                  <div className="mt-1 text-lg font-black text-gray-900 dark:text-white">{Number(r.count || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 审核决策列表 */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-black text-gray-900 dark:text-white">审核决策列表</h2>
          <div className="flex items-center gap-2">
            <select
              value={decisionsFilter.status || ''}
              onChange={(e) => setDecisionsFilter(f => ({ ...f, status: e.target.value || undefined }))}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
              <option value="failed">失败</option>
            </select>
            <select
              value={decisionsFilter.targetType || ''}
              onChange={(e) => setDecisionsFilter(f => ({ ...f, targetType: e.target.value || undefined }))}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">全部类型</option>
              <option value="story">故事</option>
              <option value="chapter">章节</option>
              <option value="comment">评论</option>
              <option value="spinoff">番外</option>
              <option value="booklist">书单</option>
              <option value="user">用户</option>
            </select>
            <button
              onClick={() => loadDecisions(0)}
              className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              刷新
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {decisionsLoading ? (
            <div className="px-6 py-10 text-center text-gray-400">加载中...</div>
          ) : decisions.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400">暂无审核决策数据</div>
          ) : (
            decisions.map((d: any) => (
              <div key={d.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={d.status} />
                      <span className="text-xs text-gray-400">{d.targetType}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-500 font-mono truncate">{d.targetId}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                      {d.labels && <span className="text-xs text-gray-400 mr-2">标签: {d.labels}</span>}
                      {d.reasons && <span className="text-xs text-gray-400">原因: {d.reasons}</span>}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      来源: {d.provider || 'unknown'} · {new Date(d.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 分页 */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <button
            disabled={decisionsPage === 0 || decisionsLoading}
            onClick={() => loadDecisions(decisionsPage - 1)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-400">第 {decisionsPage + 1} 页</span>
          <button
            disabled={decisions.length < decisionsLimit || decisionsLoading}
            onClick={() => loadDecisions(decisionsPage + 1)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>

      {/* 手动审核弹窗 */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">手动审核</h3>
              <p className="text-xs text-gray-400 mt-1">对指定内容进行人工审核决策</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">目标类型</label>
                  <select
                    value={manualForm.targetType}
                    onChange={(e) => setManualForm(f => ({ ...f, targetType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  >
                    <option value="story">故事</option>
                    <option value="chapter">章节</option>
                    <option value="comment">评论</option>
                    <option value="spinoff">番外</option>
                    <option value="booklist">书单</option>
                    <option value="user">用户</option>
                    <option value="character">角色</option>
                    <option value="ai_asset">AI资源</option>
                    <option value="media_asset">媒体资源</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">审核结果</label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm(f => ({ ...f, status: e.target.value as 'approved' | 'rejected' }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  >
                    <option value="approved">通过</option>
                    <option value="rejected">拒绝</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">目标ID</label>
                <input
                  type="text"
                  value={manualForm.targetId}
                  onChange={(e) => setManualForm(f => ({ ...f, targetId: e.target.value }))}
                  placeholder="输入目标内容的UUID"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">标签（可选，逗号分隔）</label>
                <input
                  type="text"
                  value={manualForm.labels}
                  onChange={(e) => setManualForm(f => ({ ...f, labels: e.target.value }))}
                  placeholder="如: spam, advertising"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">原因（可选，每行一条）</label>
                <textarea
                  value={manualForm.reasons}
                  onChange={(e) => setManualForm(f => ({ ...f, reasons: e.target.value }))}
                  placeholder="输入审核原因..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setManualModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                disabled={manualSubmitting || !manualForm.targetId.trim()}
                onClick={submitManualDecision}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {manualSubmitting ? '提交中...' : '确认审核'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationDashboard;
