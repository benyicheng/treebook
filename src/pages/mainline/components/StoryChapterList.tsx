import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, BookOpen, Edit3, BookMarked, Share2 } from 'lucide-react';
import ChapterEditor from '../../../components/Editor/ChapterEditor';

interface StoryChapterListProps {
  currentStory: any;
  isAuthor: boolean;
  editingChapterId: string | null;
  setEditingChapterId: (id: string | null) => void;
  setIsChapterModalOpen: (open: boolean) => void;
  setBooklistTargetChapter: (target: any) => void;
  handleSaveChapter: (content: string) => void;
  storyId: string;
}

const StoryChapterList: React.FC<StoryChapterListProps> = ({
  currentStory,
  isAuthor,
  editingChapterId,
  setEditingChapterId,
  setIsChapterModalOpen,
  setBooklistTargetChapter,
  handleSaveChapter,
  storyId,
}) => {
  return (
    <div className="bg-white dark:bg-ink-700 rounded-3xl shadow-sm border border-ink-100 dark:border-ink-600 overflow-hidden">
      {editingChapterId ? (
        <div className="p-8 h-[700px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black">编辑章节</h3>
            <button onClick={() => setEditingChapterId(null)} className="text-ink-500 font-bold hover:text-ink-600">取消编辑</button>
          </div>
          <ChapterEditor 
            chapterId={editingChapterId} 
            storyId={storyId}
            initialContent={(currentStory.chapters || []).find((c: any) => c.id === editingChapterId)?.content || ''} 
            onSave={handleSaveChapter}
          />
        </div>
      ) : (
        <div className="divide-y divide-ink-100 dark:divide-ink-600">
          <div className="p-8 flex items-center justify-between bg-ink-50 dark:bg-ink-800/50">
            <h3 className="text-xl font-black">全书目录</h3>
            {isAuthor && (
              <button 
                onClick={() => setIsChapterModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-xl text-sm font-bold hover:bg-accent-600 transition-all"
              >
                <PlusCircle size={16} />
                添加新章节
              </button>
            )}
          </div>
          {(currentStory.chapters || []).length > 0 ? (
            (currentStory.chapters || []).map((chapter: any) => (
              <div key={chapter.id} className="p-8 hover:bg-ink-50 dark:hover:bg-ink-800/30 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <span className="text-4xl font-black text-ink-100 dark:text-ink-700 group-hover:text-accent-100 dark:group-hover:text-blue-900 transition-colors w-12">
                      {chapter.orderIndex.toString().padStart(2, '0')}
                    </span>
                    <div>
                      <Link 
                        to={`/read/${chapter.id}`}
                        className="text-xl font-bold text-ink-800 dark:text-white group-hover:text-accent-500 transition-colors mb-1 block hover:underline"
                      >
                        {chapter.title}
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-ink-400">
                        <span>约 {((chapter.content || '').length / 2).toFixed(0)} 字</span>
                        <span className="w-1 h-1 bg-ink-300 rounded-full"></span>
                        <span>{new Date(chapter.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isAuthor && (
                      <button 
                        onClick={(e) => { e.preventDefault(); setEditingChapterId(chapter.id); }}
                        className="p-3 text-ink-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-xl transition-all"
                        title="编辑章节"
                      >
                        <Edit3 size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => setBooklistTargetChapter({ id: chapter.id, title: chapter.title })}
                      className="p-3 text-ink-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-xl transition-all"
                      title="加入书单"
                    >
                      <BookMarked size={20} />
                    </button>
                    <button className="p-3 text-ink-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-xl transition-all">
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-ink-100 dark:bg-ink-700 rounded-full flex items-center justify-center mx-auto text-ink-400">
                <BookOpen size={40} />
              </div>
              <p className="text-ink-500 font-medium">暂无章节内容</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoryChapterList;
