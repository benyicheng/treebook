import React from 'react';
import type { ChapterExtended } from '../../../api/types';
import WikiText from '../../../components/wiki/WikiText';

interface ChapterContentProps {
  chapter: ChapterExtended | null;
  handleTextSelect: (e: React.MouseEvent) => void;
}

export const ChapterContent: React.FC<ChapterContentProps> = ({
  chapter,
  handleTextSelect,
}) => {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none" onClick={handleTextSelect}>
      <h1 className="text-2xl md:text-3xl font-black text-ink-800 dark:text-white mb-8 mt-4">
        {chapter?.title}
      </h1>

      {chapter?.subtitle && (
        <p className="text-lg text-ink-500 dark:text-ink-400 italic mb-8">
          {chapter.subtitle}
        </p>
      )}

      <div className="md-prose md-prose--reading prose-content">
        <WikiText content={chapter?.content || ''} />
      </div>

      {chapter?.tags && chapter.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8">
          {chapter.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-xs font-bold rounded-full bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
};

export default ChapterContent;
