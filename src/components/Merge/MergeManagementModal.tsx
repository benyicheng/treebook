import React, { useState, useEffect } from 'react';
import { GitPullRequest, X, CheckCircle, XCircle, Clock, AlertCircle, MessageSquare, Sparkles, ShieldCheck } from 'lucide-react';
import { mergeService, MergeRequest } from '../../api/mergeService';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface MergeManagementModalProps {
  storyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MergeManagementModal: React.FC<MergeManagementModalProps> = ({ storyId, isOpen, onClose, onSuccess }) => {
  const [requests, setRequests] = useState<MergeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await mergeService.getRequests(storyId);
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: string, status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      await mergeService.handleRequest(requestId, status, reviewComment);
      setReviewingId(null);
      setReviewComment('');
      fetchRequests();
      onSuccess();
    } catch (err) {
      alert('处理失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-700 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
              <GitPullRequest size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">全时空审核中心</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Universe Review Center</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-sm font-bold text-gray-400">正在同步时空申请数据...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-6 text-center">
              <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-300">
                <Clock size={48} />
              </div>
              <div>
                <p className="text-lg font-black text-gray-900 dark:text-white">暂无挂起的审核申请</p>
                <p className="text-sm text-gray-400 font-medium mt-1">当社区作者发起合并或认证申请时，会显示在这里</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((req) => (
                <div key={req.id} className="group bg-gray-50 dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            req.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                            req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {req.status === 'pending' ? '待审核' : req.status === 'approved' ? '已批准' : '已拒绝'}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                            req.type === 'branch_merge' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                          }`}>
                            {req.type === 'branch_merge' ? <GitPullRequest size={10}/> : <Sparkles size={10}/>}
                            {req.type === 'branch_merge' ? '分支合并' : '番外认证'}
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-gray-900 dark:text-white">
                          {req.type === 'branch_merge' ? `分支：${req.branch?.title}` : `番外：${req.spinoff?.title}`}
                        </h4>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500 font-medium">发起人：<span className="text-indigo-600 font-black">@{req.type === 'branch_merge' ? req.branch?.author.username : req.spinoff?.author.username}</span></p>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-xs text-gray-400 font-bold">
                            {format(new Date(req.createdAt), 'yyyy/MM/dd HH:mm', { locale: zhCN })}
                          </span>
                        </div>
                      </div>
                      
                      {req.status === 'pending' && reviewingId !== req.id && (
                        <button 
                          onClick={() => setReviewingId(req.id)}
                          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-indigo-500/10 active:scale-95"
                        >
                          开始审核
                        </button>
                      )}
                    </div>

                    <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3 shadow-sm">
                      <div className="flex items-start gap-3">
                        <MessageSquare size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">申请说明</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{req.message || '（无）'}</p>
                        </div>
                      </div>
                      
                      {req.reviewComment && (
                        <div className="pt-3 border-t border-gray-50 dark:border-gray-700 flex items-start gap-3">
                          <CheckCircle size={16} className="text-emerald-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-black text-emerald-600/60 uppercase tracking-widest mb-1">审核批复</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{req.reviewComment}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {reviewingId === req.id && (
                      <div className="mt-6 p-6 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-900 space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2">
                          <label className="text-sm font-black text-indigo-700 dark:text-indigo-300 ml-1">审核批复 (给作者留言)</label>
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="请填写通过或拒绝的理由..."
                            className="w-full h-24 px-4 py-3 bg-white dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-sm font-medium shadow-sm"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleReview(req.id, 'rejected')}
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-black transition-all disabled:opacity-50"
                          >
                            <XCircle size={18} />
                            拒绝申请
                          </button>
                          <button
                            onClick={() => handleReview(req.id, 'approved')}
                            disabled={isSubmitting}
                            className="flex-2 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                          >
                            <ShieldCheck size={18} />
                            批准认证
                          </button>
                          <button
                            onClick={() => setReviewingId(null)}
                            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl font-black transition-all"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
            <AlertCircle size={20} />
          </div>
          <p className="text-xs font-bold text-gray-500 leading-relaxed">
            温馨提示：批准申请后，该分支将成为“官方正典”或该番外获得“官方认证”。官方内容将获得更高权重及专属展示位。
          </p>
        </div>
      </div>
    </div>
  );
};

export default MergeManagementModal;
