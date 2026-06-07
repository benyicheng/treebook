import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSiteConfigStore } from '../stores/useSiteConfigStore';
import { useRecentReads, useStories } from '../hooks/useStories';
import { useHotBooklists } from '../hooks/useBooklists';
import { useNewBranches } from '../hooks/useBranches';
import { useHotReadingPaths } from '../hooks/useDiscover';
import { useSiteStats } from '../hooks/useSiteStats';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Megaphone, Sparkles, Infinity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Story } from '../api/storyService';

import HeroBanner from '../components/home/HeroBanner';
import EditorPicks from '../components/home/EditorPicks';
import ContinueReading from '../components/home/ContinueReading';
import NewStoriesGrid from '../components/home/NewStoriesGrid';
import ActiveBranches from '../components/home/ActiveBranches';
import HomeSidebar from '../components/home/HomeSidebar';
import ExploreSection from '../components/home/ExploreSection';
import HomeFooter from '../components/home/HomeFooter';
import { ActivityFeed } from '../components/notifications';
import SectionTitle from '../components/home/SectionTitle';
import { stagger } from '../components/home/shared';

const Home: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: storiesData, isLoading: storiesLoading } = useStories();
  const stories = Array.isArray(storiesData) ? storiesData : (storiesData as any)?.data || [];
  const { user, isAuthenticated } = useAuthStore();
  const { config, fetchConfig } = useSiteConfigStore();
  const recentReadsQuery = useRecentReads();
  const hotBooklistsQuery = useHotBooklists();
  const hotReadingPathsQuery = useHotReadingPaths();
  const newBranchesQuery = useNewBranches();

  // Redirect legacy ?search= queries to the dedicated search page
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      navigate(`/search?q=${encodeURIComponent(searchParam)}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const [bannerIndex, setBannerIndex] = useState(0);
  const [exploreTab, setExploreTab] = useState<string>('热门');
  const bannerTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial data fetch (config from Zustand store - stories now use React Query)
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Banner slides
  let bannerSlides: any[] = [];
  try { bannerSlides = JSON.parse(config.bannerSlides || '[]'); } catch { /* ignore */ }
  const slides = bannerSlides.length > 0 ? bannerSlides : [{
    imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&h=400&fit=crop',
    title: '书树创作计划',
    description: '汇聚全球万千创作者，在这里，每一个故事都有无限可能。',
    buttonText: '开始创作',
    link: '#'
  }];

  useEffect(() => {
    if (slides.length < 2) return;
    bannerTimer.current = setInterval(() => {
      setBannerIndex(i => (i + 1) % slides.length);
    }, 5000);
    return () => { if (bannerTimer.current) clearInterval(bannerTimer.current); };
  }, [slides.length]);

  const goBanner = useCallback((i: number) => {
    setBannerIndex(i);
    if (bannerTimer.current) { clearInterval(bannerTimer.current); bannerTimer.current = null; }
  }, []);

  // Editor picks
  let editorPicks: any[] = [];
  try { editorPicks = JSON.parse(config.editorPicks || '[]'); } catch { /* ignore */ }
  const displayedPicks = editorPicks.length > 0 ? editorPicks : stories.slice(0, 4);

  // Sorted stories for explore section
  const sortedStories = useMemo(() => {
    const list = [...stories];
    switch (exploreTab) {
      case '热门': return list.sort((a, b) => ((b as any).viewCount || 0) - ((a as any).viewCount || 0));
      case '新书': return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case '官方': return list.filter(s => s.isOfficial);
      case '完结': return list.filter(s => s.status === 'completed');
      default: return list;
    }
  }, [stories, exploreTab]);

  const recentReads = recentReadsQuery.data ?? [];
  const hotBooklists = hotBooklistsQuery.data ?? [];
  const hotReadingPaths = hotReadingPathsQuery.data ?? [];
  const newBranches = newBranchesQuery.data ?? [];

  const { data: siteStats } = useSiteStats();

  return (
    <div className="pb-0 font-sans">
      {/* FULL-WIDTH HERO AREA */}
      <div className="-mx-8 mb-12">
        {/* ANNOUNCEMENT */}
        {config.announcementEnabled === 'true' && config.announcement && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8 overflow-hidden bg-gradient-to-r from-accent-600 via-accent-500 to-accent-500 px-8 py-4 shadow-xl shadow-accent-500/20"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="relative flex items-start gap-3">
              <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg shrink-0 mt-0.5">
                <Megaphone size={15} className="text-white" />
              </div>
              <p className="text-sm font-semibold text-white/95 leading-relaxed">{config.announcement}</p>
            </div>
          </motion.div>
        )}

        {/* HERO BANNER */}
        <HeroBanner slides={slides} bannerIndex={bannerIndex} goBanner={goBanner} fullWidth />
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* LEFT: 68% */}
        <div className="lg:w-[68%] space-y-14">
          <EditorPicks displayedPicks={displayedPicks} storiesLoading={storiesLoading} />

          {isAuthenticated && recentReads.length > 0 && (
            <ContinueReading recentReads={recentReads} />
          )}

          <NewStoriesGrid stories={stories} storiesLoading={storiesLoading} />

          {/* Section Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-dashed border-ink-200 dark:border-ink-700" />
            </div>
            <div className="relative flex justify-center">
              <div className="px-4 bg-gradient-to-b from-ink-50 to-white dark:from-ink-800 dark:to-ink-800">
                <div className="p-2 rounded-full bg-ink-50 dark:bg-ink-700 shadow-sm border border-ink-100 dark:border-ink-600">
                  <Infinity size={16} className="text-accent-400" />
                </div>
              </div>
            </div>
          </div>

          <ActiveBranches newBranches={newBranches} />
        </div>

        {/* RIGHT SIDEBAR: 32% */}
        <HomeSidebar
          stories={stories}
          stats={siteStats}
          newBranches={newBranches}
          storiesLoading={storiesLoading}
          hotBooklists={hotBooklists}
          hotReadingPaths={hotReadingPaths}
        />
      </div>

      {/* EXPLORE SECTION */}
      <ExploreSection
        sortedStories={sortedStories}
        storiesLoading={storiesLoading}
        exploreTab={exploreTab}
        setExploreTab={setExploreTab}
      />

      {/* ACTIVITY FEED */}
      {user && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="relative max-w-6xl mx-auto px-4 mb-12"
        >
          <SectionTitle
            icon={Sparkles}
            gradient="from-amber-500 to-orange-500"
            title="关注动态"
          />
          <div className="bg-white dark:bg-ink-800 rounded-3xl border border-ink-100 dark:border-ink-700 shadow-sm overflow-hidden">
            <ActivityFeed mode="feed" limit={20} />
          </div>
        </motion.section>
      )}

      <HomeFooter config={config} />

    </div>
  );
};

export default Home;
