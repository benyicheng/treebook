import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, BookOpen, Users, GitBranch } from 'lucide-react';

interface BannerSlide {
  imageUrl: string;
  title: string;
  description: string;
  buttonText?: string;
  link?: string;
}

interface SiteStats {
  stories: number;
  users: number;
  branches: number;
}

interface HeroBannerProps {
  slides: BannerSlide[];
  bannerIndex: number;
  goBanner: (i: number) => void;
  fullWidth?: boolean;
  stats?: SiteStats;
  siteName?: string;
}

const statConfig = [
  { key: 'stories' as const, label: '作品', icon: BookOpen },
  { key: 'users' as const, label: '创作者', icon: Users },
  { key: 'branches' as const, label: '分支宇宙', icon: GitBranch },
];

const HeroBanner: React.FC<HeroBannerProps> = ({ slides, bannerIndex, goBanner, fullWidth, stats, siteName }) => {
  const navigate = useNavigate();
  const slide = slides[bannerIndex];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative w-full overflow-hidden shadow-2xl group ${
        fullWidth
          ? '-mt-28 pt-28 min-h-[300px] md:aspect-[21/7] md:max-h-[420px]'
          : 'aspect-[21/8] max-h-[460px] rounded-3xl mb-12 border border-ink-100/50 dark:border-ink-700/50'
      }`}
    >
      {/* Background image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={bannerIndex}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${slide.imageUrl})` }}
        />
      </AnimatePresence>

      {/* Dark uniform overlay for center readability — inspired by aurealife.asia */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        {/* Eyebrow tag */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-white/90 text-[11px] font-bold mb-6 w-fit border border-white/10"
        >
          <Sparkles size={12} className="text-yellow-300" />
          {siteName || '精选推荐'}
        </motion.div>

        {/* Headline */}
        <motion.h2
          key={`title-${bannerIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-[1.1] drop-shadow-2xl max-w-4xl tracking-tight"
        >
          {slide.title}
        </motion.h2>

        {/* Description */}
        <motion.p
          key={`desc-${bannerIndex}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-sm sm:text-base md:text-lg text-white/70 mb-8 leading-relaxed max-w-xl font-medium"
        >
          {slide.description}
        </motion.p>

        {/* Dual CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex items-center gap-4 flex-wrap justify-center"
        >
          <button
            onClick={() => navigate(slide.link || '#')}
            className="group/btn px-8 py-3.5 bg-ink-50 text-ink-800 text-sm font-black rounded-full hover:bg-ink-50 transition-all shadow-2xl active:scale-95 flex items-center gap-2.5"
          >
            {slide.buttonText || '查看详情'}
            <ArrowRight size={15} className="transition-transform group-hover/btn:translate-x-1" />
          </button>
          <button
            onClick={() => navigate('/stories')}
            className="px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white text-sm font-black rounded-full border border-white/25 hover:bg-white/20 hover:border-white/40 transition-all active:scale-95"
          >
            探索更多
          </button>
        </motion.div>

        {/* Stats row */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="hidden sm:flex items-center gap-8 md:gap-14 mt-8 pt-6 border-t border-white/15"
          >
            {statConfig.map(({ key, label, icon: Icon }) => {
              const value = stats[key];
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                    <Icon size={14} className="text-white/80" />
                  </div>
                  <div className="text-left">
                    <div className="text-white text-lg md:text-xl font-black leading-none">{value.toLocaleString()}+</div>
                    <div className="text-white/50 text-xs md:text-sm font-medium mt-0.5">{label}</div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Bottom dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goBanner(i)}
              className={`transition-all duration-500 rounded-full ${
                i === bannerIndex
                  ? 'w-10 h-2.5 bg-ink-50 shadow-lg shadow-white/30'
                  : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Side arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => goBanner((bannerIndex - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:bg-black/40 hover:text-white hover:border-white/30 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
            aria-label="上一张"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => goBanner((bannerIndex + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:bg-black/40 hover:text-white hover:border-white/30 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
            aria-label="下一张"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </motion.section>
  );
};

export default HeroBanner;
