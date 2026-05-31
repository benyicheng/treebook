import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Heart, Layers, ChevronRight } from 'lucide-react';
import { Booklist } from '../../api/storyService';

interface BooklistCardProps {
  booklist: Booklist;
}

const BooklistCard: React.FC<BooklistCardProps> = ({ booklist }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/booklist/${booklist.id}`)}
      className="group cursor-pointer bg-ink-50 dark:bg-ink-700 rounded-[2.5rem] border border-ink-100 dark:border-ink-600 overflow-hidden hover:border-emerald-300 dark:hover:border-accent-400 hover:shadow-2xl hover:shadow-accent-400/10 transition-all duration-500 flex flex-col"
    >
      {/* Cover Image Area */}
      <div className="relative h-48 overflow-hidden bg-slate-200">
        <img 
          src={(booklist as any).coverImage || 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800'} 
          alt={booklist.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-3 py-1 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg ${
            (booklist as any).type === 'TIMELINE' ? 'bg-accent-600' : 'bg-accent-500'
          }`}>
            {(booklist as any).type === 'TIMELINE' ? '时空导览' : '精选合集'}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-[10px] font-bold">
              {booklist.creator?.username?.[0] || 'A'}
            </div>
            <span className="text-xs font-bold text-white/90">{booklist.creator?.username || 'Anonymous'}</span>
          </div>
          <div className="flex items-center gap-3 text-white/80 text-[10px] font-black">
            <div className="flex items-center gap-1">
              <Eye size={12} />
              {(booklist as any).viewCount || 0}
            </div>
            <div className="flex items-center gap-1">
              <Heart size={12} />
              {(booklist as any).likesCount || 0}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-8 space-y-4 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-2">
          {(booklist as any).tags?.split(',').filter(Boolean).map((tag: string) => (
            <span key={tag} className="text-[10px] font-black text-accent-500 dark:text-accent-400 uppercase tracking-widest">
              #{tag.trim()}
            </span>
          ))}
        </div>
        <h3 className="text-2xl font-black text-ink-800 dark:text-white group-hover:text-accent-500 transition-colors line-clamp-2">
          {booklist.title}
        </h3>
        <p className="text-ink-500 dark:text-ink-400 font-light leading-relaxed text-sm line-clamp-3 italic">
          "{booklist.description || '暂无描述'}"
        </p>
        <div className="pt-6 mt-auto flex items-center justify-between border-t border-ink-50 dark:border-ink-600/50">
          <div className="flex items-center gap-2 text-xs font-bold text-ink-400">
            <Layers size={14} />
            <span>{booklist._count?.items || 0} 站旅程</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-black text-accent-500 group-hover:gap-2 transition-all">
            进入时空
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BooklistCard;
