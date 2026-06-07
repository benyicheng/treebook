import React, { useState } from 'react';
import { Comment } from '../../api/storyService';
import { useChapterComments, useCreateComment } from '../../hooks/useChapters';
import { useAuthStore } from '../../stores/useAuthStore';
import { MessageSquare, Send, Clock } from 'lucide-react';
import { useToast } from '../../components/notifications';
import { useNavigate } from 'react-router-dom';

interface CommentSectionProps {
  chapterId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ chapterId }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  const { data: comments = [], isLoading } = useChapterComments(chapterId);
  const createCommentMutation = useCreateComment();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      await createCommentMutation.mutateAsync({ chapterId, content: newComment });
      setNewComment('');
    } catch (err) {
      addToast('error', '评论发送失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-20 pt-12 border-t border-ink-100 dark:border-ink-700 space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-50 dark:bg-accent-500/10 text-accent-500 rounded-xl">
            <MessageSquare size={20} />
          </div>
          <h3 className="text-xl font-black text-ink-800 dark:text-white">时空对话</h3>
        </div>
        <span className="text-xs font-bold text-ink-400 uppercase tracking-widest">{comments.length} 条互动</span>
      </div>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="relative group">
          <textarea
            rows={3}
            className="w-full p-6 bg-ink-50 dark:bg-ink-800 border-2 border-ink-100 dark:border-ink-700 rounded-3xl focus:border-accent-400 outline-none transition-all resize-none font-medium text-ink-600 dark:text-ink-300 shadow-sm"
            placeholder="在这里留下你的印记..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="absolute bottom-4 right-4 p-3 bg-accent-500 text-white rounded-2xl hover:bg-accent-600 transition-all shadow-lg shadow-accent-400/20 disabled:opacity-50 active:scale-95"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      ) : (
        <div className="p-8 bg-ink-50 dark:bg-ink-700/50 rounded-3xl border-2 border-dashed border-ink-200 dark:border-ink-600 text-center">
          <p className="text-ink-500 font-medium mb-4">登录后即可参与时空对话</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-ink-800 dark:bg-white text-white dark:text-ink-800 rounded-2xl font-black text-sm hover:opacity-90 transition-all"
          >
            立即登录
          </button>
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-6">
        {isLoading ? (
          [1, 2].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-12 h-12 bg-ink-200 dark:bg-ink-700 rounded-2xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-ink-200 dark:bg-ink-700 rounded-full w-24"></div>
                <div className="h-4 bg-ink-100 dark:bg-ink-700 rounded-full w-full"></div>
              </div>
            </div>
          ))
        ) : comments.length > 0 ? (
          comments.map((comment: Comment) => (
            <div key={comment.id} className="flex gap-5 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-accent-500 font-black text-lg shrink-0 shadow-sm">
                {comment.author.avatarUrl ? (
                  <img src={comment.author.avatarUrl} alt={comment.author.username} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  comment.author.username[0]
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-ink-800 dark:text-white">{comment.author.username}</span>
                    {comment.author.role === 'author' && (
                      <span className="px-2 py-0.5 bg-accent-400 text-white text-[8px] font-black rounded-full uppercase tracking-widest">官方</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-ink-400 font-bold uppercase tracking-widest">
                    <Clock size={12} />
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-5 bg-ink-50 dark:bg-ink-800 rounded-2xl border border-ink-50 dark:border-ink-700 shadow-sm group-hover:border-accent-100 dark:group-hover:border-accent-900/30 transition-all">
                  <p className="text-sm text-ink-500 dark:text-ink-300 leading-relaxed font-medium">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-ink-400 text-sm font-medium italic">暂无对话记录，快来抢占时空沙发</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
