import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  priority?: 'high' | 'auto' | 'low';
}

/**
 * Drishti Official Logo
 * Renders the exact user-provided logo file without redrawing or recolouring.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 28,
  className = '',
  priority = 'auto'
}) => {
  return (
    <img
      src="/logo.png"
      alt="Drishti"
      width={size}
      height={size}
      decoding="async"
      fetchPriority={priority}
      className={`object-contain select-none shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
};
