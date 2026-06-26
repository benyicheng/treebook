import React, { useState } from 'react';
import { GitPullRequest, Send, X, AlertCircle } from 'lucide-react';
import { mergeService } from '../../api/mergeService';

interface MergeRequestModalProps {
  storyId: string;
  branchId: string;
  branchTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MergeRequestModal: React.FC<MergeRequestModalProps> = ({ storyId, branchId, branchTitle, isOpen, onClose, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await mergeService.createRequest({
        storyId,
        branchId,
        message
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '发起合并请求失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-ink-700 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-ink-100 dark:border-ink-600">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent-100 text-accent-600 rounded-2xl">
                <GitPullRequest size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-ink-800 dark:text-white">发起合并请求</h3>
                <p className="text-xs text-ink-400 font-bold uppercase tracking-widest mt-0.5">Merge Request</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-ink-100 dark:hover:bg-ink-600 rounded-xl transition-colors">
              <X size={20} className="text-ink-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-accent-50 border border-accent-100 rounded-2xl">
              <p className="text-sm font-bold text-accent-700">即将合并分支：</p>
              <p className="text-lg font-black text-accent-800 mt-1">{branchTitle}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-ink-500 dark:text-ink-400 ml-1">合并说明 (可选)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="向原作者说明为什么该分支值得被合入官方正典..."
                className="w-full h-32 px-4 py-3 bg-ink-50 dark:bg-ink-800 border-none rounded-2xl focus:ring-2 focus:ring-accent-500 transition-all resize-none text-sm font-medium"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl animate-in shake duration-500">
                <AlertCircle size={20} />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white rounded-2xl font-black shadow-lg shadow-accent-500/20 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  发起合并请求
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MergeRequestModal;
