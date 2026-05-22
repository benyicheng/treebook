import React from 'react';

export const Page: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={['max-w-7xl mx-auto pb-20 px-4', className || ''].join(' ').trim()}>
      {children}
    </div>
  );
};

