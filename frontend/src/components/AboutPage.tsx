import React, { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import {
  ArrowRight,
  Upload,
  MessageSquare,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TreePine,
  Building,
  Waves
} from 'lucide-react';

/**
 * ============================================================================
 * TUNABLE SCRUB & ANIMATION CONSTANTS
 * ============================================================================
 */
export const SCRUB = {
  SCROLL_LENGTH_VH: 800,        // total scroll distance driving the video (desktop)
  MOBILE_SCROLL_LENGTH_VH: 500, // total scroll distance driving the video (mobile)
  SMOOTHING_MS: 1200,           // smoothing time constant (~1.2s ease)
  LERP_FACTOR: 0.09,            // per-frame easing (responsive and silky smooth)
  SECTION_FADE_MS: 1000,        // crossfade between content chapters
  FPS: 24,                      // frame rate matching source video (24 fps)
  WHEEL_MULTIPLIER: 0.9,        // Lenis wheel input multiplier
  LENIS_DURATION: 1.2,          // Lenis smoothing duration in seconds
  MODE: 'video' as 'video' | 'frames', // 'video' (HTML5 video) or 'frames' (canvas image sequence)
  TOTAL_FRAMES: 164,            // Total extracted frames for 'frames' mode
};

interface AboutPageProps {
  onNavigate: (route: '/' | '/chat') => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const hdVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Chapter DOM refs for 60fps direct RAF style mutations (zero React re-render lag)
  const ch0Ref = useRef<HTMLDivElement>(null);
  const ch1Ref = useRef<HTMLDivElement>(null);
  const ch2Ref = useRef<HTMLDivElement>(null);
  const ch3Ref = useRef<HTMLDivElement>(null);
  const ch4Ref = useRef<HTMLDivElement>(null);

  // Step 0: Debug HUD refs (toggle with ?debug=1)
  const debugOverlayRef = useRef<HTMLDivElement>(null);
  const debugProgressRef = useRef<HTMLSpanElement>(null);
  const debugTargetTimeRef = useRef<HTMLSpanElement>(null);
  const debugCurrentTimeRef = useRef<HTMLSpanElement>(null);
  const debugSeekingRef = useRef<HTMLSpanElement>(null);
  const debugReadyStateRef = useRef<HTMLSpanElement>(null);
  const debugMsBetweenSeeksRef = useRef<HTMLSpanElement>(null);
  const debugVariantRef = useRef<HTMLSpanElement>(null);

  // Frames mode cache
  const framesCacheRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const lastDrawnFrameRef = useRef<number>(-1);

  const [previewReady, setPreviewReady] = useState(false);
  const [hdReady, setHdReady] = useState(false);
  const isHdActiveRef = useRef(false);
  const [isHdActive, setIsHdActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Progressive quality: Serve 1080p HD to all desktops and tablets.
  // Serve 1280 preview/mobile ONLY when screen < 768px, saveData is on, or connection is 2G
  const [shouldLoadHd, setShouldLoadHd] = useState(() => {
    if (typeof window === 'undefined') return true;
    const isMobileViewport = window.innerWidth < 768;
    const isSaveData = (navigator as any)?.connection?.saveData === true;
    const isSlowConnection = ['2g', 'slow-2g'].includes((navigator as any)?.connection?.effectiveType);
    return !isMobileViewport && !isSaveData && !isSlowConnection;
  });

  // Check URL query param ?debug=1
  const [showDebug] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug') === '1';
  });

  // Detect mobile, connection constraints, and resize
  useEffect(() => {
    const updateDimensions = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      const isSaveData = (navigator as any)?.connection?.saveData === true;
      const isSlowConnection = ['2g', 'slow-2g'].includes((navigator as any)?.connection?.effectiveType);
      const allowHd = !mobile && !isSaveData && !isSlowConnection;
      setShouldLoadHd(allowHd);
      if (!allowHd) {
        setIsHdActive(false);
        isHdActiveRef.current = false;
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mqMotion.matches);
    const motionHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mqMotion.addEventListener('change', motionHandler);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      mqMotion.removeEventListener('change', motionHandler);
    };
  }, []);

  // Preload frame 1 for canvas frames fallback mode
  useEffect(() => {
    if (SCRUB.MODE === 'frames') {
      const img1 = new Image();
      img1.src = '/frames/f_0001.webp';
      img1.onload = () => {
        framesCacheRef.current.set(1, img1);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvasRef.current.width = window.innerWidth * dpr;
            canvasRef.current.height = window.innerHeight * dpr;
            ctx.drawImage(img1, 0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      };
    }
  }, []);

  // Main single-rAF scroll & seek-gated scrub loop
  useEffect(() => {
    const previewVideo = previewVideoRef.current;
    const hdVideo = hdVideoRef.current;
    if (reducedMotion) return;

    if (previewVideo) {
      previewVideo.muted = true;
      previewVideo.playsInline = true;
      previewVideo.pause();
    }
    if (hdVideo) {
      hdVideo.muted = true;
      hdVideo.playsInline = true;
      hdVideo.pause();
    }

    // Step 1: Initialise Lenis to normalise wheel and trackpad input
    const lenis = new Lenis({
      duration: SCRUB.LENIS_DURATION,
      smoothWheel: true,
      wheelMultiplier: SCRUB.WHEEL_MULTIPLIER,
      touchMultiplier: 1.2,
      syncTouch: false,
    });
    lenisRef.current = lenis;

    let currentVideoTime = 0;
    let isSeeking = false;
    let pendingSeekTime: number | null = null;
    let lastSeekTime = 0;
    let lastSeekInterval = 0;
    let rafId: number;

    const performSeek = (targetSec: number) => {
      const activeVideo = (isHdActiveRef.current && hdVideoRef.current && hdVideoRef.current.readyState >= 2)
        ? hdVideoRef.current
        : previewVideoRef.current;

      if (!activeVideo || !isFinite(activeVideo.duration) || activeVideo.duration <= 0 || activeVideo.readyState < 2) {
        return;
      }
      const clamped = Math.max(0, Math.min(activeVideo.duration, targetSec));

      if (isSeeking || activeVideo.seeking) {
        pendingSeekTime = clamped;
        return;
      }

      const diff = Math.abs(clamped - activeVideo.currentTime);
      if (diff >= (0.35 / SCRUB.FPS)) {
        isSeeking = true;
        const now = performance.now();
        if (lastSeekTime > 0) {
          lastSeekInterval = now - lastSeekTime;
        }
        lastSeekTime = now;
        activeVideo.currentTime = clamped;
      }

      // If HD video is buffering in background, keep its playhead synced
      if (!isHdActiveRef.current && hdVideoRef.current && hdVideoRef.current.readyState >= 3 && !hdVideoRef.current.seeking) {
        if (Math.abs(hdVideoRef.current.currentTime - clamped) >= (0.5 / SCRUB.FPS)) {
          hdVideoRef.current.currentTime = clamped;
        }
      }
    };

    const handleSeeked = () => {
      isSeeking = false;
      if (pendingSeekTime !== null) {
        const next = pendingSeekTime;
        pendingSeekTime = null;
        performSeek(next);
      }
    };

    const handlePreviewLoaded = () => {
      setPreviewReady(true);
      if (previewVideoRef.current) previewVideoRef.current.pause();
    };

    const handleHdLoaded = () => {
      setHdReady(true);
      if (hdVideoRef.current) {
        hdVideoRef.current.pause();
        hdVideoRef.current.currentTime = currentVideoTime;
      }
    };

    if (previewVideo) {
      previewVideo.addEventListener('loadedmetadata', handlePreviewLoaded);
      previewVideo.addEventListener('canplay', handlePreviewLoaded);
      previewVideo.addEventListener('seeked', handleSeeked);
      if (previewVideo.readyState >= 1) {
        handlePreviewLoaded();
      }
    }

    if (hdVideo) {
      hdVideo.addEventListener('loadedmetadata', handleHdLoaded);
      hdVideo.addEventListener('canplay', handleHdLoaded);
      hdVideo.addEventListener('seeked', handleSeeked);
      if (hdVideo.readyState >= 1) {
        handleHdLoaded();
      }
    }

    /**
     * Quintic smootherstep easing function (C2 continuous: zero velocity & zero acceleration at boundaries):
     * S(t) = 6t^5 - 15t^4 + 10t^3
     */
    const smootherstep = (t: number): number => {
      const c = Math.max(0, Math.min(1, t));
      return c * c * c * (c * (c * 6 - 15) + 10);
    };

    // Direct chapter opacity & transform calculator with smootherstep easing and micro-scale
    const updateChapter = (
      el: HTMLDivElement | null,
      progress: number,
      start: number,
      peakStart: number,
      peakEnd: number,
      end: number
    ) => {
      if (!el) return;
      let opacity = 0;
      let translateY = 28;
      let scale = 0.975;
      let blurPx = 0;

      if (progress >= start && progress <= end) {
        if (progress < peakStart) {
          // Entering: smootherstep ease-in-out
          const f = smootherstep((progress - start) / (peakStart - start));
          opacity = f;
          translateY = 28 * (1 - f);
          scale = 0.975 + 0.025 * f;
          blurPx = (1 - f) * 4;
        } else if (progress <= peakEnd) {
          // Full peak visibility
          opacity = 1;
          translateY = 0;
          scale = 1.0;
          blurPx = 0;
        } else {
          // Exiting: smootherstep ease-in-out
          const f = smootherstep((progress - peakEnd) / (end - peakEnd));
          opacity = 1 - f;
          translateY = -24 * f;
          scale = 1.0 + 0.018 * f;
          blurPx = f * 4;
        }
      } else if (progress > end) {
        opacity = 0;
        translateY = -24;
        scale = 1.018;
        blurPx = 4;
      } else {
        opacity = 0;
        translateY = 28;
        scale = 0.975;
        blurPx = 4;
      }

      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0) scale3d(${scale.toFixed(4)}, ${scale.toFixed(4)}, 1)`;
      if (blurPx > 0.1 && opacity < 0.95) {
        el.style.filter = `blur(${blurPx.toFixed(1)}px)`;
      } else {
        el.style.filter = 'none';
      }
      el.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
      el.style.visibility = opacity > 0.005 ? 'visible' : 'hidden';
    };

    // Draw canvas image sequence (Step 4 fallback)
    const drawCanvasFrame = (progress: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const total = SCRUB.TOTAL_FRAMES;
      const frameIdx = Math.min(Math.max(Math.floor(progress * (total - 1)) + 1, 1), total);

      if (frameIdx === lastDrawnFrameRef.current) return;

      const padded = String(frameIdx).padStart(4, '0');
      const src = `/frames/f_${padded}.webp`;

      let img = framesCacheRef.current.get(frameIdx);
      if (!img) {
        img = new Image();
        img.src = src;
        framesCacheRef.current.set(frameIdx, img);
      }

      // Preload next 5 frames
      for (let offset = 1; offset <= 5; offset++) {
        const nextIdx = frameIdx + offset;
        if (nextIdx <= total && !framesCacheRef.current.has(nextIdx)) {
          const preImg = new Image();
          preImg.src = `/frames/f_${String(nextIdx).padStart(4, '0')}.webp`;
          framesCacheRef.current.set(nextIdx, preImg);
        }
      }

      if (img.complete && img.naturalWidth > 0) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          lastDrawnFrameRef.current = frameIdx;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const w = Math.round(window.innerWidth * dpr);
          const h = Math.round(window.innerHeight * dpr);
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Exact cover-fit math with integer-rounded destination rectangles to avoid half-pixel blur
          const imgRatio = img.naturalWidth / img.naturalHeight;
          const canvasRatio = w / h;
          let drawW = w;
          let drawH = h;
          let offX = 0;
          let offY = 0;

          if (canvasRatio > imgRatio) {
            drawW = w;
            drawH = Math.round(w / imgRatio);
            offY = Math.round((h - drawH) / 2);
          } else {
            drawH = h;
            drawW = Math.round(h * imgRatio);
            offX = Math.round((w - drawW) / 2);
          }

          // Optional slow zoom up to 1.04 rendered directly in drawImage (not as a CSS transform)
          const zoom = 1.0 + progress * 0.04;
          const zw = Math.round(drawW * zoom);
          const zh = Math.round(drawH * zoom);
          const zx = Math.round(offX - (zw - drawW) / 2);
          const zy = Math.round(offY - (zh - drawH) / 2);

          ctx.drawImage(img, zx, zy, zw, zh);
        }
      }
    };

    // The single, unified rAF loop driving Lenis and video scrubbing
    const singleRafLoop = (time: number) => {
      // 1. Advance Lenis smooth scroll
      lenis.raf(time);

      // Read normalized scroll progress directly from Lenis (no getBoundingClientRect or DOM reads)
      const progress = lenis.limit > 0 ? Math.min(Math.max(lenis.scroll / lenis.limit, 0), 1) : 0;

      // 2. Video mode scrubbing (Seek-queueing with 0ms All-Intra seek response)
      let targetTime = 0;
      if (SCRUB.MODE === 'video') {
        const activeVid = (isHdActiveRef.current && hdVideoRef.current && hdVideoRef.current.readyState >= 2)
          ? hdVideoRef.current
          : previewVideoRef.current;

        if (activeVid && isFinite(activeVid.duration) && activeVid.duration > 0) {
          targetTime = progress * activeVid.duration;

          // Smooth responsive interpolation towards target time
          currentVideoTime += (targetTime - currentVideoTime) * SCRUB.LERP_FACTOR;

          // Quantise to frame grid
          const quantisedTime = Math.round(currentVideoTime * SCRUB.FPS) / SCRUB.FPS;
          performSeek(quantisedTime);

          // NOTE: NO transform: scale on video element (preserves 1:1 pixel sharpness)!
        }

        // Progressive HD swap: when HD is loaded in background (readyState >= 3) and times align, activate HD seamlessly
        if (shouldLoadHd && !isHdActiveRef.current && hdVideoRef.current && hdVideoRef.current.readyState >= 3) {
          if (Math.abs(hdVideoRef.current.currentTime - currentVideoTime) < 0.05) {
            isHdActiveRef.current = true;
            setIsHdActive(true);
          }
        }
      } else if (SCRUB.MODE === 'frames') {
        // Step 4: Canvas Image Sequence
        drawCanvasFrame(progress);
      }

      // 3. Direct DOM style updates for chapters (with smootherstep easing & seamless crossfades)
      updateChapter(ch0Ref.current, progress, 0.00, 0.00, 0.14, 0.26);
      updateChapter(ch1Ref.current, progress, 0.16, 0.27, 0.42, 0.52);
      updateChapter(ch2Ref.current, progress, 0.44, 0.54, 0.66, 0.76);
      updateChapter(ch3Ref.current, progress, 0.68, 0.78, 0.88, 0.95);
      updateChapter(ch4Ref.current, progress, 0.88, 0.95, 1.00, 1.00);

      // 4. Update Step 0 Debug Overlay (zero React re-renders)
      if (showDebug) {
        const activeVid = (isHdActiveRef.current && hdVideoRef.current) ? hdVideoRef.current : previewVideoRef.current;
        if (debugProgressRef.current) {
          debugProgressRef.current.textContent = (progress * 100).toFixed(1) + '%';
        }
        if (debugTargetTimeRef.current) {
          debugTargetTimeRef.current.textContent = targetTime.toFixed(3) + 's';
        }
        if (debugCurrentTimeRef.current && activeVid) {
          debugCurrentTimeRef.current.textContent = activeVid.currentTime.toFixed(3) + 's';
        }
        if (debugSeekingRef.current && activeVid) {
          debugSeekingRef.current.textContent = String(activeVid.seeking);
          debugSeekingRef.current.className = activeVid.seeking ? 'text-amber-400 font-bold' : 'text-emerald-400';
        }
        if (debugReadyStateRef.current && activeVid) {
          debugReadyStateRef.current.textContent = `${activeVid.readyState} (${
            activeVid.readyState === 4
              ? 'HAVE_ENOUGH_DATA'
              : activeVid.readyState === 3
              ? 'HAVE_FUTURE_DATA'
              : activeVid.readyState === 2
              ? 'HAVE_CURRENT_DATA'
              : 'BUFFERING'
          })`;
        }
        if (debugMsBetweenSeeksRef.current) {
          debugMsBetweenSeeksRef.current.textContent = lastSeekInterval > 0 ? `${lastSeekInterval.toFixed(0)}ms` : 'idle';
        }
        if (debugVariantRef.current) {
          const name = isHdActiveRef.current
            ? '1080p HD (Active)'
            : shouldLoadHd
            ? '1280p Preview (HD buffering...)'
            : '1280p Mobile / Data Saver (Active)';
          debugVariantRef.current.textContent = name;
          debugVariantRef.current.className = isHdActiveRef.current ? 'font-bold text-emerald-400' : 'font-bold text-cyan-300';
        }
      }

      rafId = requestAnimationFrame(singleRafLoop);
    };

    rafId = requestAnimationFrame(singleRafLoop);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      if (previewVideo) {
        previewVideo.removeEventListener('loadedmetadata', handlePreviewLoaded);
        previewVideo.removeEventListener('canplay', handlePreviewLoaded);
        previewVideo.removeEventListener('seeked', handleSeeked);
      }
      if (hdVideo) {
        hdVideo.removeEventListener('loadedmetadata', handleHdLoaded);
        hdVideo.removeEventListener('canplay', handleHdLoaded);
        hdVideo.removeEventListener('seeked', handleSeeked);
      }
    };
  }, [reducedMotion, showDebug, shouldLoadHd]);

  // Smooth scroll to Chapter 2 via Lenis
  const scrollToHowItWorks = () => {
    if (lenisRef.current && lenisRef.current.limit > 0) {
      lenisRef.current.scrollTo(lenisRef.current.limit * 0.30);
    }
  };

  const totalVh = isMobile ? SCRUB.MOBILE_SCROLL_LENGTH_VH : SCRUB.SCROLL_LENGTH_VH;

  return (
    <div
      ref={containerRef}
      style={{ height: `${totalVh}vh` }}
      className="relative w-full bg-[#02040A] text-[#C9D3EA] selection:bg-cyan-500/30 selection:text-cyan-200"
    >
      {/* ===================================================================
          1. FULL-BLEED FIXED BACKGROUND VIDEO / CANVAS (Visible in 85%+ viewport)
          =================================================================== */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none">
        {reducedMotion ? (
          <img
            src="/assets/earth-horizon.png"
            alt="Earth orbital horizon"
            className="w-full h-full object-cover object-center"
          />
        ) : SCRUB.MODE === 'frames' ? (
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover object-center"
            style={{ opacity: 1 }}
          />
        ) : (
          <div className="relative w-full h-full">
            {/* Layer 1: Preview / Mobile Video (1280x720 All-Intra 24fps, instantaneous start) */}
            <video
              ref={previewVideoRef}
              src="/earth-scrub-preview.mp4"
              poster="/assets/earth-horizon.png"
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              onError={() => {
                if (previewVideoRef.current && previewVideoRef.current.src !== '/assets/back.mp4') {
                  previewVideoRef.current.src = '/assets/back.mp4';
                }
              }}
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{
                opacity: previewReady ? 1 : 0,
                transition: 'opacity 300ms ease',
              }}
            />

            {/* Layer 2: Full 1080p HD Video (1920x1080 All-Intra 24fps CRF 15, background loaded) */}
            {shouldLoadHd && (
              <video
                ref={hdVideoRef}
                src="/earth-scrub-1080.mp4"
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                onError={() => {
                  setIsHdActive(false);
                  isHdActiveRef.current = false;
                }}
                className="absolute inset-0 w-full h-full object-cover object-center"
                style={{
                  opacity: isHdActive ? 1 : 0,
                  transition: 'opacity 400ms ease',
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* ===================================================================
          STEP 0: DIAGNOSTIC DEBUG OVERLAY (?debug=1)
          =================================================================== */}
      {showDebug && (
        <div
          ref={debugOverlayRef}
          className="fixed bottom-6 right-6 z-[100] bg-slate-950/90 border border-cyan-500/50 rounded-2xl p-4 font-mono text-xs text-cyan-300 shadow-2xl backdrop-blur-xl pointer-events-none select-none space-y-1.5 min-w-[260px]"
        >
          <div className="font-bold text-white border-b border-white/10 pb-1.5 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              SCRUB DIAGNOSTICS
            </span>
            <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300">?debug=1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Stream Variant:</span>
            <span ref={debugVariantRef} className="font-bold text-emerald-400">1080p HD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Scroll Progress:</span>
            <span ref={debugProgressRef} className="font-bold text-white">0.0%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Target Time:</span>
            <span ref={debugTargetTimeRef}>0.000s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Current Time:</span>
            <span ref={debugCurrentTimeRef}>0.000s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">video.seeking:</span>
            <span ref={debugSeekingRef}>false</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">readyState:</span>
            <span ref={debugReadyStateRef}>0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">ms between seeks:</span>
            <span ref={debugMsBetweenSeeksRef}>idle</span>
          </div>
          <div className="flex justify-between pt-1.5 border-t border-white/10 text-[10px] text-slate-400">
            <span>Engine Mode:</span>
            <span className="text-cyan-400 font-bold uppercase">{SCRUB.MODE}</span>
          </div>
        </div>
      )}

      {/* ===================================================================
          2. STICKY VIEWPORT CONTAINER (Hosts overlapping chapters)
          =================================================================== */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden z-10 px-4 sm:px-6 lg:px-8">
        
        {/* =================================================================
            CHAPTER 1: HERO (ONLY "DRISHTI" DISPLAYED AT THE START)
            ================================================================= */}
        <div
          ref={ch0Ref}
          style={{
            opacity: 1,
            transform: 'translate3d(0, 0px, 0) scale3d(1, 1, 1)',
            backfaceVisibility: 'hidden',
          }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto will-change-[transform,opacity,filter]"
        >
          {/* DRISHTI Title */}
          <h1
            className="font-heading font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-[#22D3EE] drop-shadow-[0_0_80px_rgba(34,211,238,0.6)] select-none"
            style={{ fontSize: 'clamp(4rem, 12vw, 9.5rem)' }}
          >
            DRISHTI
          </h1>
        </div>

        {/* =================================================================
            CHAPTER 2: HOW IT WORKS
            Upload -> Ask -> Evidence -> Verdict in horizontal line
            ================================================================= */}
        <div
          ref={ch1Ref}
          style={{
            opacity: 0,
            transform: 'translate3d(0, 28px, 0) scale3d(0.975, 0.975, 1)',
            visibility: 'hidden',
            backfaceVisibility: 'hidden',
          }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto will-change-[transform,opacity,filter]"
        >
          <div className="text-center mb-10 sm:mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#22D3EE] font-medium block mb-3">
              PIPELINE
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white/90 tracking-[-0.02em]">
              From Raw Pixels to Verified Truth
            </h2>
          </div>

          {/* 4 Steps in a Horizontal Line with thin glowing connector */}
          <div className="relative w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-[#22D3EE]/40 to-transparent -z-10" />

            {/* Step 1: Upload */}
            <div className="light-glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] text-[#22D3EE] font-semibold tracking-wider">
                    01
                  </span>
                  <Upload className="w-5 h-5 text-[#22D3EE]" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-white/95 mb-2">
                  Upload
                </h3>
                <p className="font-sans text-sm text-[#C9D3EA] leading-relaxed">
                  Ingest raster imagery (PNG, JPG, GeoTIFF) or connect satellite APIs.
                </p>
              </div>
            </div>

            {/* Step 2: Ask */}
            <div className="light-glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] text-[#22D3EE] font-semibold tracking-wider">
                    02
                  </span>
                  <MessageSquare className="w-5 h-5 text-[#22D3EE]" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-white/95 mb-2">
                  Ask in plain English
                </h3>
                <p className="font-sans text-sm text-[#C9D3EA] leading-relaxed">
                  Query natural language: count structures, detect alterations, delineate AOIs.
                </p>
              </div>
            </div>

            {/* Step 3: Evidence */}
            <div className="light-glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] text-[#22D3EE] font-semibold tracking-wider">
                    03
                  </span>
                  <Layers className="w-5 h-5 text-[#22D3EE]" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-white/95 mb-2">
                  Evidence on every answer
                </h3>
                <p className="font-sans text-sm text-[#C9D3EA] leading-relaxed">
                  Inspect pixel-precise vector polygons and bounding boxes directly drawn on the scene.
                </p>
              </div>
            </div>

            {/* Step 4: Verdict */}
            <div className="light-glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] text-[#22D3EE] font-semibold tracking-wider">
                    04
                  </span>
                  <ShieldCheck className="w-5 h-5 text-[#22D3EE]" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-white/95 mb-2">
                  Honest verdicts
                </h3>
                <p className="font-sans text-sm text-[#C9D3EA] leading-relaxed">
                  Verifiable answers backed by sensor resolution and atmospheric occlusion audits.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================
            CHAPTER 3: THE THREE VERDICTS (The Trust Story)
            Display style identical to Image 2: 3-column vertical card grid
            ================================================================= */}
        <div
          ref={ch2Ref}
          style={{
            opacity: 0,
            transform: 'translate3d(0, 28px, 0) scale3d(0.975, 0.975, 1)',
            visibility: 'hidden',
            backfaceVisibility: 'hidden',
          }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto will-change-[transform,opacity,filter]"
        >
          <div className="text-center mb-10 sm:mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#22D3EE] font-medium block mb-3">
              EPISTEMIC CALIBRATION
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white/90 tracking-[-0.02em] mb-3">
              Honest Verdicts, Never Guesses
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#C9D3EA] max-w-[50ch] mx-auto">
              Drishti refuses to hallucinate certainty. Every response is classified by sensor physics.
            </p>
          </div>

          {/* 3-Column Grid of Vertical Cards (matching the blue styled format of Image 1) */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: ANSWERED */}
            <div className="light-glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] text-[#22D3EE] font-semibold tracking-wider">
                    01
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-[#22D3EE]" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-white/95 mb-2">
                  ANSWERED
                </h3>
                <p className="font-sans text-sm text-[#C9D3EA] leading-relaxed">
                  High-confidence pixel proof meeting strict GSD resolution and cloud cover limits.
                </p>
              </div>
            </div>

            {/* Card 2: UNCERTAIN */}
            <div className="light-glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] text-[#22D3EE] font-semibold tracking-wider">
                    02
                  </span>
                  <AlertTriangle className="w-5 h-5 text-[#22D3EE]" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-white/95 mb-2">
                  UNCERTAIN
                </h3>
                <p className="font-sans text-sm text-[#C9D3EA] leading-relaxed">
                  Cloud occlusion, atmospheric haze, or low sun angles prevent factual assertion.
                </p>
              </div>
            </div>

            {/* Card 3: REFUSED */}
            <div className="light-glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] text-[#22D3EE] font-semibold tracking-wider">
                    03
                  </span>
                  <XCircle className="w-5 h-5 text-[#22D3EE]" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-white/95 mb-2">
                  REFUSED
                </h3>
                <p className="font-sans text-sm text-[#C9D3EA] leading-relaxed">
                  Query exceeds physical optical diffraction limits or violates spatial safety policies.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================
            CHAPTER 4: USE CASES (Image 2)
            Forest protection, flood-plain growth, disaster response
            ================================================================= */}
        <div
          ref={ch3Ref}
          style={{
            opacity: 0,
            transform: 'translate3d(0, 28px, 0) scale3d(0.975, 0.975, 1)',
            visibility: 'hidden',
            backfaceVisibility: 'hidden',
          }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto will-change-[transform,opacity,filter]"
        >
          <div className="text-center mb-10 sm:mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#22D3EE] font-medium block mb-3">
              MISSION APPLICATIONS
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white/90 tracking-[-0.02em]">
              Proven in High-Stakes Terrains
            </h2>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Case 1: Forest Protection */}
            <div className="light-glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] text-[#22D3EE] font-semibold tracking-wider">
                    01
                  </span>
                  <TreePine className="w-5 h-5 text-[#22D3EE]" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-white/95 mb-2">
                  Forest Protection
                </h3>
                <p className="font-sans text-sm text-[#C9D3EA] leading-relaxed">
                  Detect canopy loss, illegal logging roads, and bi-temporal NDVI forest degradation.
                </p>
              </div>
            </div>

            {/* Case 2: Flood-Plain Growth */}
            <div className="light-glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] text-[#22D3EE] font-semibold tracking-wider">
                    02
                  </span>
                  <Building className="w-5 h-5 text-[#22D3EE]" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-white/95 mb-2">
                  Flood-Plain Growth
                </h3>
                <p className="font-sans text-sm text-[#C9D3EA] leading-relaxed">
                  Trace unpermitted sprawl and quantify impermeable surface expansion along waterways.
                </p>
              </div>
            </div>

            {/* Case 3: Disaster Response */}
            <div className="light-glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] text-[#22D3EE] font-semibold tracking-wider">
                    03
                  </span>
                  <Waves className="w-5 h-5 text-[#22D3EE]" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-white/95 mb-2">
                  Disaster Response
                </h3>
                <p className="font-sans text-sm text-[#C9D3EA] leading-relaxed">
                  Rapid mapping of flood inundation, breached levees, and severed emergency corridors.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================
            CHAPTER 5: FINAL CALL TO ACTION & FOOTER
            ONE centered button to "/chat", logo in footer
            ================================================================= */}
        <div
          ref={ch4Ref}
          style={{
            opacity: 0,
            transform: 'translate3d(0, 28px, 0) scale3d(0.975, 0.975, 1)',
            visibility: 'hidden',
            backfaceVisibility: 'hidden',
          }}
          className="absolute inset-0 flex flex-col justify-between items-center px-4 max-w-4xl mx-auto pt-24 pb-8 will-change-[transform,opacity,filter]"
        >
          {/* Centered CTA */}
          <div className="my-auto text-center flex flex-col items-center">
            {/* Soft local vignette */}
            <div
              className="absolute w-[460px] h-[280px] rounded-full pointer-events-none -z-10"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(2,4,10,0.35) 0%, transparent 70%)',
              }}
            />

            <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#22D3EE] font-medium mb-4 block">
              READY TO EXPLORE
            </span>

            <h2 className="font-heading font-bold text-3xl sm:text-5xl text-white/95 tracking-[-0.02em] mb-5">
              Start Your Inspection
            </h2>

            <p className="font-sans text-[17px] text-[#C9D3EA] max-w-[50ch] mb-9">
              Deploy Drishti Studio directly in your browser. No GIS installation or complex tooling required.
            </p>

            <button
              type="button"
              onClick={() => onNavigate('/chat')}
              className="px-10 py-4 rounded-[20px] text-base font-semibold text-slate-950 bg-[#22D3EE] hover:bg-[#67e8f9] shadow-[0_0_35px_rgba(34,211,238,0.5)] transition-all inline-flex items-center gap-3 active:scale-95 group"
            >
              <span>Launch Drishti Studio</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Clean Footer with Logo */}
          <footer className="w-full pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-slate-400 select-none">
            <div className="flex items-center gap-3">
              {!logoError ? (
                <img
                  src="/logo.png"
                  alt="Drishti Logo"
                  onError={() => setLogoError(true)}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <div className="h-8 w-8 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center text-xs font-mono text-cyan-400">
                  D
                </div>
              )}
              <span className="font-heading font-bold text-sm text-white/90">
                Drishti
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono text-[11px]">
                Satellite & Geospatial Intelligence
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-400 text-xs">
              <span>Evidence, not guesses.</span>
              <span>© {new Date().getFullYear()} Drishti</span>
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
};
