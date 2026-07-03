import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';

interface BannerSlide {
  imageUrl: string;
  title: string;
  description: string;
  buttonText?: string;
  link?: string;
}

interface HeroBannerProps {
  slides: BannerSlide[];
  bannerIndex: number;
  goBanner: (i: number) => void;
  fullWidth?: boolean;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ slides, bannerIndex, goBanner, fullWidth }) => {
  const navigate = useNavigate();
  const slide = slides[bannerIndex];

  // 空数据兜底：避免访问 undefined.imageUrl 导致崩溃
  if (!slide) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative w-full overflow-hidden shadow-2xl flex items-center justify-center ${
          fullWidth
            ? '-mt-28 pt-28 min-h-[300px] md:aspect-[21/7] md:max-h-[420px]'
            : 'aspect-[21/8] max-h-[460px] rounded-3xl mb-12 border border-ink-100/50 dark:border-ink-700/50'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 via-ink-50 to-accent-500/5 dark:from-accent-500/15 dark:via-ink-800 dark:to-accent-500/10" />
        <div className="relative flex flex-col items-center text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-accent-500/10 dark:bg-accent-500/20 flex items-center justify-center mb-4">
            <Sparkles size={24} className="text-accent-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-ink-800 dark:text-white mb-2">
            暂无精选内容
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-6 max-w-md">
            精彩故事正在路上，先去探索其他作品吧
          </p>
          <button
            onClick={() => navigate('/stories')}
            className="px-6 py-3 bg-accent-500 text-white text-sm font-semibold rounded-full hover:bg-accent-600 transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            探索更多
            <ArrowRight size={15} />
          </button>
        </div>
      </motion.section>
    );
  }

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

      {/* Top fade for nav readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent" />
      {/* Bottom fade for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        {/* Headline */}
        <motion.h2
          key={`title-${bannerIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.2] max-w-4xl"
        >
          {slide.title}
        </motion.h2>

        {/* Description */}
        <motion.p
          key={`desc-${bannerIndex}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-sm sm:text-base md:text-lg text-white/80 mb-10 leading-relaxed max-w-2xl font-normal"
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
            className="group/btn px-8 py-3.5 bg-ink-50 text-ink-800 text-sm font-semibold rounded-full hover:bg-ink-50 transition-all shadow-2xl active:scale-95 flex items-center gap-2.5"
          >
            {slide.buttonText || '查看详情'}
            <ArrowRight size={15} className="transition-transform group-hover/btn:translate-x-1" />
          </button>
          <button
            onClick={() => navigate('/stories')}
            className="px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/25 hover:bg-white/20 hover:border-white/40 transition-all active:scale-95"
          >
            探索更多
          </button>
        </motion.div>
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
