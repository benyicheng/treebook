import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryStore } from '../../stores/useStoryStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Book, Image as ImageIcon, Type, AlignLeft, Send, ArrowLeft } from 'lucide-react';

const CreateStoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { createStory, isLoading } = useStoryStore();
  const { isAuthenticated } = useAuthStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !formData.tags.includes(tag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const story = await createStory(formData);
      navigate(`/story/${story.id}`);
    } catch (err) {
      alert('创建失败，请检查网络连接');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-2 text-gray-500 font-bold hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={20} />
        返回
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-8 md:p-12 space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">开启你的新宇宙</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-light leading-relaxed">
              每一个伟大的故事都始于一个大胆的设想。在这里，你可以创建主线故事，并邀请全球创作者共同探索平行时空的无限可能。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-gray-400 uppercase tracking-widest">
                  <Type size={16} />
                  故事标题
                </label>
                <input 
                  type="text"
                  required
                  placeholder="给你的宇宙起个响亮的名字..."
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-xl font-bold"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-gray-400 uppercase tracking-widest">
                  <AlignLeft size={16} />
                  故事简介
                </label>
                <textarea 
                  required
                  rows={5}
                  placeholder="简述你的世界观、核心冲突和主要角色..."
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg font-light resize-none leading-relaxed"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-gray-400 uppercase tracking-widest">
                  <Type size={16} />
                  分类标签
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-sm font-bold flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-800">×</button>
                    </span>
                  ))}
                </div>
                <input 
                  type="text"
                  placeholder="输入标签后按回车或逗号添加..."
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-gray-400 uppercase tracking-widest">
                  <ImageIcon size={16} />
                  封面图片 URL (可选)
                </label>
                <input 
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                  value={formData.coverImage}
                  onChange={e => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                />
                <p className="text-xs text-gray-400 italic">提示：留空将自动生成一张充满科幻感的 AI 封面。</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send size={24} />
                    确认开启宇宙
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateStoryPage;
