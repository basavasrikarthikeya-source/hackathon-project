import React from 'react';

export type LogoVariant = 'header' | 'footer' | 'sidebar' | 'rail' | 'chat' | 'hero';

interface LogoProps {
  variant?: LogoVariant;
  size?: number;
  className?: string;
  priority?: 'high' | 'auto' | 'low';
}

export const Logo: React.FC<LogoProps> = ({
  variant,
  size: explicitSize,
  className = '',
  priority = 'auto'
}) => {
  // Determine standard base dimensions based on variant or explicit size
  let baseWidth = 60;
  let baseHeight = 60;
  let variantClass = '';

  if (explicitSize) {
    baseWidth = explicitSize;
    baseHeight = explicitSize;
  } else {
    switch (variant) {
      case 'header':
        baseWidth = 60;
        baseHeight = 60;
        // 48px on screens < 768px, 60px on desktop
        variantClass = 'w-[var(--logo-header-sm,48px)] h-[var(--logo-header-sm,48px)] md:w-[var(--logo-header,60px)] md:h-[var(--logo-header,60px)]';
        break;
      case 'footer':
        baseWidth = 44;
        baseHeight = 44;
        variantClass = 'w-[var(--logo-footer,44px)] h-[var(--logo-footer,44px)]';
        break;
      case 'sidebar':
        baseWidth = 48;
        baseHeight = 48;
        variantClass = 'w-[var(--logo-sidebar,48px)] h-[var(--logo-sidebar,48px)]';
        break;
      case 'rail':
        baseWidth = 40;
        baseHeight = 40;
        variantClass = 'w-[var(--logo-rail,40px)] h-[var(--logo-rail,40px)]';
        break;
      case 'chat':
        baseWidth = 44;
        baseHeight = 44;
        variantClass = 'w-[var(--logo-chat,44px)] h-[var(--logo-chat,44px)]';
        break;
      case 'hero':
        baseWidth = 72;
        baseHeight = 72;
        variantClass = 'w-[var(--logo-hero,72px)] h-[var(--logo-hero,72px)]';
        break;
      default:
        baseWidth = 44;
        baseHeight = 44;
        variantClass = 'w-[44px] h-[44px]';
    }
  }

  // Rule 5: Use 512px asset for any size above 56px so it stays razor-sharp on Retina screens
  const isLarge = baseWidth > 56 || variant === 'header' || variant === 'hero';
  const defaultSrc = isLarge ? '/logo-512.png' : '/logo-256.png';
  const srcSet = isLarge
    ? '/logo-256.png 1x, /logo-512.png 2x'
    : '/logo-256.png 1x, /logo-512.png 2x';

  return (
    <img
      src={defaultSrc}
      srcSet={srcSet}
      alt="Drishti"
      width={baseWidth}
      height={baseHeight}
      decoding="async"
      fetchPriority={priority}
      className={`object-contain select-none shrink-0 aspect-square ${variantClass} ${className}`}
      style={explicitSize ? { width: `${explicitSize}px`, height: `${explicitSize}px` } : undefined}
    />
  );
};
