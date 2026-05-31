import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail } from 'lucide-react';

interface FooterConfig {
  siteName?: string;
  footerCopyright?: string;
  icp?: string;
  contactEmail?: string;
}

interface HomeFooterProps {
  config: FooterConfig;
}

const HomeFooter: React.FC<HomeFooterProps> = ({ config }) => (
  <footer className="relative mt-20 pt-14 pb-8 border-t border-ink-200/70 dark:border-ink-700/70">
    {/* Subtle bg */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink-50/50 to-transparent dark:via-ink-800/30 pointer-events-none" />

    <div className="relative max-w-6xl mx-auto px-4">
      {/* Top: Links grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-md shadow-accent-400/20">
              <Sparkles size={15} className="text-white" />
            </div>
            <span className="text-base font-black text-ink-800 dark:text-white">
              {config.siteName || '平行宇宙'}
            </span>
          </div>
          <p className="text-xs text-ink-400 dark:text-ink-500 leading-relaxed max-w-xs">
            汇聚全球万千创作者，让每一个故事都有无限可能。在这里，你可以创作、分享和探索无穷的平行宇宙。
          </p>
          <div className="flex items-center gap-3 mt-4">
            {config.contactEmail && (
              <a href={`mailto:${config.contactEmail}`} className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-accent-400 transition-colors">
                <Mail size={12} />
                <span className="hidden sm:inline truncate">{config.contactEmail}</span>
              </a>
            )}
          </div>
        </div>

        {/* Links */}
        {[
          {
            title: '关于',
            links: [
              { name: '关于我们', to: '/about' },
              { name: '联系方式', to: '/contact' },
              { name: '加入我们', to: '/join' },
            ]
          },
          {
            title: '创作',
            links: [
              { name: '创作指南', to: '/author/guide' },
              { name: '作者福利', to: '/author/benefits' },
              { name: '版权保护', to: '/author/copyright' },
            ]
          },
          {
            title: '支持',
            links: [
              { name: '帮助中心', to: '/help' },
              { name: '意见反馈', to: '/feedback' },
              { name: '投诉举报', to: '/report' },
            ]
          },
        ].map((group) => (
          <div key={group.title}>
            <h5 className="text-xs font-black text-ink-800 dark:text-white uppercase tracking-widest mb-4">
              {group.title}
            </h5>
            <ul className="space-y-2.5">
              {group.links.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="text-xs text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300 transition-colors font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="pt-6 border-t border-ink-100 dark:border-ink-700/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] text-ink-400 dark:text-ink-500 font-medium tracking-wider text-center md:text-left">
            <span>{config.footerCopyright || '© 2026 PARALLEL UNIVERSE STORY PLATFORM. All rights reserved.'}</span>
            {config.icp && <span className="ml-2 opacity-60">{config.icp}</span>}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-ink-400 dark:text-ink-500">
            <a href="#" className="hover:text-ink-500 dark:hover:text-ink-400 transition-colors">隐私政策</a>
            <span className="opacity-30">|</span>
            <a href="#" className="hover:text-ink-500 dark:hover:text-ink-400 transition-colors">服务条款</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default HomeFooter;
