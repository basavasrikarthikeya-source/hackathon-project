import React, { useEffect, useRef, useState } from 'react';

interface ScrollBackgroundVideoProps {
  /** Path to the video file, e.g. "/assets/back.mp4" */
  src: string;
  /** Optional poster image shown before video metadata loads */
  poster?: string;
  /** Opacity of the video layer (default 0.4) */
  opacity?: number;
  /** Whether to render dark radial/linear gradients on top of the video for readability */
  showGradientOverlay?: boolean;
}

/**
 * ScrollBackgroundVideo
 * 
 * Binds video playback directly to user scroll position:
 * - Video does NOT autoplay.
 * - Scrolling down scrubs the video forward.
 * - Scrolling up scrubs the video backward.
 * - Uses requestAnimationFrame with lerp interpolation for silky scrubbing.
 */
export const ScrollBackgroundVideo: React.FC<ScrollBackgroundVideoProps> = ({
  src,
  poster = '/assets/earth-horizon.png',
  opacity = 0.4,
  showGradientOverlay = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const targetTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video is paused so it never plays autonomously
    video.pause();

    const handleLoaded = () => {
      setIsLoaded(true);
      video.pause();
      updateScrollProgress();
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('canplay', handleLoaded);

    if (video.readyState >= 1) {
      handleLoaded();
    }

    // Smooth seek loop using requestAnimationFrame
    const updateVideoFrame = () => {
      if (video && isFinite(video.duration) && video.duration > 0) {
        if (!video.seeking) {
          const diff = targetTimeRef.current - video.currentTime;
          // Apply gentle lerp if difference is noticeable
          if (Math.abs(diff) > 0.015) {
            video.currentTime = video.currentTime + diff * 0.22;
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateVideoFrame);
    };

    animationFrameRef.current = requestAnimationFrame(updateVideoFrame);

    // Calculate scroll ratio (0.0 to 1.0)
    const updateScrollProgress = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      if (maxScroll <= 0 || !video || !isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      targetTimeRef.current = progress * video.duration;
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('canplay', handleLoaded);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover object-center transition-opacity duration-700"
        style={{
          opacity: isLoaded ? opacity : opacity * 0.3,
          filter: 'contrast(1.1) brightness(0.9)',
        }}
      />

      {/* Vignette & Contrast Overlays for text legibility */}
      {showGradientOverlay && (
        <>
          {/* Subtle top-to-bottom dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070d]/70 via-[#05070d]/40 to-[#05070d]/90 pointer-events-none" />
          {/* Vignette around edges */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#05070d]/30 to-[#05070d]/80 pointer-events-none" />
        </>
      )}
    </div>
  );
};
