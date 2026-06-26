import React, { useState } from 'react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
type AvatarShape = 'circle' | 'rounded';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const shapeClasses: Record<AvatarShape, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-2xl',
};

const Avatar: React.FC<AvatarProps> = ({ src, alt = '', fallback = '?', size = 'md', shape = 'circle', className = '' }) => {
  const [hasError, setHasError] = useState(false);

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className={`${sizeClasses[size]} ${shapeClasses[shape]} object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${shapeClasses[shape]} bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold shrink-0 ${className}`}
    >
      {fallback?.[0]?.toUpperCase() || '?'}
    </div>
  );
};

export default Avatar;
