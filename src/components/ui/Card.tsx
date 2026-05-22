import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={['bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800', className || ''].join(' ').trim()}>
      {children}
    </div>
  );
};

