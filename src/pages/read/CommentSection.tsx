import React, { useState, useEffect } from 'react';
import { chapterService, Comment } from '../../api/storyService';
import { useAuthStore } from '../../stores/useAuthStore';
import { MessageSquare, Send, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CommentSectionProps {
  chapterId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ chapterId }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [chapterId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const data = await chapterService.getComments(chapterId);
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      const comment = await chapterService.createComment(chapterId, newComment);
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (err) {
      alert('评论发送失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-20 pt-12 border-t border-gray-100 dark:border-gray-800 space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
            <MessageSquare size={20} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white">时空对话</h3>
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{comments.length} 条互动</span>
      </div>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="relative group">
          <textarea
            rows={3}
            className="w-full p-6 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl focus:border-blue-500 outline-none transition-all resize-none font-medium text-gray-700 dark:text-gray-300 shadow-sm"
            placeholder="在这里留下你的印记..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="absolute bottom-4 right-4 p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 active:scale-95"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      ) : (
        <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-500 font-medium mb-4">登录后即可参与时空对话</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-sm hover:opacity-90 transition-all"
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
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-24"></div>
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full w-full"></div>
              </div>
            </div>
          ))
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-5 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-blue-600 font-black text-lg shrink-0 shadow-sm">
                {comment.author.avatarUrl ? (
                  <img src={comment.author.avatarUrl} alt={comment.author.username} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  comment.author.username[0]
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-900 dark:text-white">{comment.author.username}</span>
                    {comment.author.role === 'author' && (
                      <span className="px-2 py-0.5 bg-blue-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest">官方</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <Clock size={12} />
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-50 dark:border-gray-800 shadow-sm group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-all">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm font-medium italic">暂无对话记录，快来抢占时空沙发</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
