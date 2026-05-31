import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from './shared';

interface SectionTitleProps {
  icon: React.ElementType;
  gradient: string;
  title: string;
  link?: string;
  linkText?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ icon: Icon, gradient, title, link, linkText }) => (
  <motion.div
    variants={fadeUp}
    className="flex items-center gap-3 mb-7"
  >
    <div className={`w-1 h-7 rounded-full bg-gradient-to-b ${gradient}`} />
    <div className="flex-1 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-10 shadow-sm`}>
          <Icon size={14} className="text-white" />
        </div>
        <h2 className="text-lg md:text-xl font-black text-ink-800 dark:text-white tracking-tight">
          {title}
        </h2>
      </div>
      {link && (
        <Link
          to={link}
          className="group flex items-center gap-1 text-xs font-bold text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition-colors"
        >
          {linkText || '更多'}
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  </motion.div>
);

export default SectionTitle;
