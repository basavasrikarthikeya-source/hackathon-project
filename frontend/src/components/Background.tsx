import React, { useState, useEffect, useRef } from 'react';

/**
 * <Background />
 * Fixed, full-clarity nebula background layer across the entire app shell.
 *
 * Rules:
 * 1. Never blur, scale-up, filter, tint or blend the final image.
 * 2. Static, fixed layer: position: fixed; inset: 0; z-index: 0; pointer-events: none.
 * 3. object-fit: cover and object-position: 55% 50% (preserves bright core and small planet).
 * 4. 32px LQIP blurred only during decode placeholder, removed once loaded. Full image fades in over 400ms.
 * 5. Preloads chosen file in <head>, solid fallback color #05070F.
 * 6. Under prefers-reduced-data (saveData), serves the 1280 file.
 */
export const Background: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Detect prefers-reduced-data
    const isSaveData = (navigator as any)?.connection?.saveData === true;
    setSaveData(isSaveData);

    // Preload candidate in <head> if not already preloaded
    const linkId = 'nebula-preload-link';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'preload';
      link.as = 'image';
      link.type = 'image/avif';
      link.href = isSaveData ? '/backgrounds/nebula-1280.webp' : '/backgrounds/nebula-2880.avif';
      (link as any).fetchPriority = 'high';
      document.head.appendChild(link);
    }
  }, []);

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (img && typeof img.decode === 'function') {
      img.decode()
        .then(() => setIsLoaded(true))
        .catch(() => setIsLoaded(true));
    } else {
      setIsLoaded(true);
    }
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#05070F]"
      aria-hidden="true"
    >
      {/* 32px LQIP placeholder painted blurred ONLY while loading, unmounted when decoded */}
      {!isLoaded && (
        <img
          src="/backgrounds/nebula-lqip.jpg"
          alt=""
          className="w-full h-full object-cover blur-2xl scale-105 transition-opacity duration-400"
          style={{ objectPosition: '55% 50%' }}
        />
      )}

      {/* Primary razor-sharp Picture source set */}
      <picture>
        {/* AVIF format (first in source order) */}
        {!saveData && (
          <source
            type="image/avif"
            srcSet="/backgrounds/nebula-2880.avif 2880w, /backgrounds/nebula-2880.avif 1920w"
            sizes="(min-width: 1920px) 2880px, 100vw"
          />
        )}

        {/* WebP format with responsive srcset */}
        <source
          type="image/webp"
          srcSet={
            saveData
              ? '/backgrounds/nebula-1280.webp 1280w'
              : '/backgrounds/nebula-1280.webp 1280w, /backgrounds/nebula-1920.webp 1920w, /backgrounds/nebula-2880.webp 2880w'
          }
          sizes={
            saveData
              ? '1280px'
              : '(max-width: 768px) 1280px, (max-width: 1920px) 1920px, 2880px'
          }
        />

        {/* Standard High-Quality JPEG fallback */}
        <img
          ref={imgRef}
          src="/backgrounds/nebula-2880.jpg"
          alt=""
          fetchPriority="high"
          onLoad={handleImageLoad}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectPosition: '55% 50%' }}
        />
      </picture>
    </div>
  );
};
