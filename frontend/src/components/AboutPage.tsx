import React, { useEffect, useRef, useState } from 'react';
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
  SCROLL_LENGTH_VH: 800,       // total scroll distance driving the video (desktop)
  MOBILE_SCROLL_LENGTH_VH: 500, // total scroll distance driving the video (mobile)
  SMOOTHING_MS: 1400,          // smoothing time constant (~1.4s ease)
  LERP_FACTOR: 0.045,          // per-frame easing (smaller = smoother)
  SECTION_FADE_MS: 1200,       // crossfade between content chapters
  MAX_SEEK_STEP_S: 0.12,       // maximum seek step delta per frame
};

interface AboutPageProps {
  onNavigate: (route: '/' | '/chat') => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Chapter DOM refs for 60fps direct RAF style mutations (zero React re-render lag)
  const ch0Ref = useRef<HTMLDivElement>(null);
  const ch1Ref = useRef<HTMLDivElement>(null);
  const ch2Ref = useRef<HTMLDivElement>(null);
  const ch3Ref = useRef<HTMLDivElement>(null);
  const ch4Ref = useRef<HTMLDivElement>(null);

  const [videoReady, setVideoReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Detect mobile & reduced motion preferences
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mqMotion.matches);
    const motionHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mqMotion.addEventListener('change', motionHandler);

    return () => {
      window.removeEventListener('resize', checkMobile);
      mqMotion.removeEventListener('change', motionHandler);
    };
  }, []);

  // Main high-performance scroll & video scrub loop
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return;

    video.muted = true;
    video.playsInline = true;
    video.pause();

    let targetProgress = 0;
    let easedProgress = 0;
    let rafId: number;

    const handleLoaded = () => {
      setVideoReady(true);
      video.pause();
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('canplay', handleLoaded);

    if (video.readyState >= 1) {
      handleLoaded();
    }

    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScrollable > 0) {
        targetProgress = Math.min(Math.max(scrollY / totalScrollable, 0), 1);
      }
    };

    // Fast seek callback on seek completion
    const onSeeked = () => {
      if (!video || !isFinite(video.duration)) return;
      const targetTime = targetProgress * video.duration;
      if (Math.abs(targetTime - video.currentTime) > 0.02) {
        video.currentTime = targetTime;
      }
    };

    video.addEventListener('seeked', onSeeked);

    // Direct chapter opacity & transform calculator (no CSS transition fighting)
    const updateChapter = (
      el: HTMLDivElement | null,
      start: number,
      peakStart: number,
      peakEnd: number,
      end: number
    ) => {
      if (!el) return;
      let opacity = 0;
      let translateY = 20;

      if (easedProgress >= start && easedProgress <= end) {
        if (easedProgress < peakStart) {
          const f = (easedProgress - start) / (peakStart - start);
          opacity = f;
          translateY = 20 * (1 - f);
        } else if (easedProgress <= peakEnd) {
          opacity = 1;
          translateY = 0;
        } else {
          const f = (easedProgress - peakEnd) / (end - peakEnd);
          opacity = 1 - f;
          translateY = -20 * f;
        }
      } else if (easedProgress > end) {
        opacity = 0;
        translateY = -20;
      }

      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
      el.style.pointerEvents = opacity > 0.08 ? 'auto' : 'none';
      el.style.visibility = opacity > 0.005 ? 'visible' : 'hidden';
    };

    const scrubLoop = () => {
      // 1. Ease progress with LERP_FACTOR for silky motion
      const progressDiff = targetProgress - easedProgress;
      easedProgress += progressDiff * SCRUB.LERP_FACTOR;

      // 2. Video frame seek & subtle slow zoom (scale 1.0 to 1.06)
      if (video) {
        const scale = 1.0 + easedProgress * 0.06;
        video.style.transform = `scale(${scale.toFixed(4)}) translateZ(0)`;

        if (isFinite(video.duration) && video.duration > 0) {
          const targetVideoTime = easedProgress * video.duration;
          if (!video.seeking && Math.abs(targetVideoTime - video.currentTime) > 0.012) {
            video.currentTime = targetVideoTime;
          }
        }
      }

      // 3. Direct DOM updates for chapters without triggering React re-renders
      updateChapter(ch0Ref.current, 0.00, 0.00, 0.17, 0.27);
      updateChapter(ch1Ref.current, 0.20, 0.28, 0.42, 0.50);
      updateChapter(ch2Ref.current, 0.44, 0.52, 0.66, 0.74);
      updateChapter(ch3Ref.current, 0.68, 0.76, 0.88, 0.94);
      updateChapter(ch4Ref.current, 0.88, 0.95, 1.00, 1.00);

      rafId = requestAnimationFrame(scrubLoop);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    rafId = requestAnimationFrame(scrubLoop);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('canplay', handleLoaded);
      video.removeEventListener('seeked', onSeeked);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  // Smooth scroll to Chapter 2 ("See how it works")
  const scrollToHowItWorks = () => {
    const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = totalScrollable * 0.30;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const totalVh = isMobile ? SCRUB.MOBILE_SCROLL_LENGTH_VH : SCRUB.SCROLL_LENGTH_VH;

  return (
    <div
      ref={containerRef}
      style={{ height: `${totalVh}vh` }}
      className="relative w-full bg-[#02040A] text-[#C9D3EA] selection:bg-cyan-500/30 selection:text-cyan-200"
    >
      {/* ===================================================================
          1. FULL-BLEED FIXED BACKGROUND VIDEO (Visible in 85%+ of viewport)
          =================================================================== */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none">
        {!reducedMotion ? (
          <video
            ref={videoRef}
            src="/assets/back.mp4"
            poster="/assets/earth-horizon.png"
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            className="w-full h-full object-cover object-center"
            style={{
              opacity: videoReady ? 0.95 : 0.6,
              willChange: 'transform',
              transition: 'opacity 800ms ease',
            }}
          />
        ) : (
          <img
            src="/assets/earth-horizon.png"
            alt="Earth orbital horizon"
            className="w-full h-full object-cover object-center opacity-90"
          />
        )}
      </div>

      {/* ===================================================================
          2. STICKY VIEWPORT CONTAINER (Hosts overlapping chapters)
          =================================================================== */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden z-10 px-4 sm:px-6 lg:px-8">
        
        {/* =================================================================
            CHAPTER 1: HERO
            ================================================================= */}
        <div
          ref={ch0Ref}
          style={{ opacity: 1, transform: 'translate3d(0, 0px, 0)' }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto will-change-transform"
        >
          {/* Soft local radial vignette behind text for legibility (max 35% opacity) */}
          <div
            className="absolute w-[600px] h-[360px] rounded-full pointer-events-none -z-10"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(2,4,10,0.35) 0%, rgba(2,4,10,0.15) 55%, transparent 75%)',
            }}
          />

          {/* Eyebrow */}
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#22D3EE] font-medium mb-5 select-none">
            GEOSPATIAL INTELLIGENCE
          </span>

          {/* Big Headline */}
          <h1
            className="font-heading font-bold text-white/95 tracking-[-0.02em] leading-[1.08] mb-6 drop-shadow-md"
            style={{ fontSize: 'clamp(2.75rem, 6vw, 5rem)' }}
          >
            See the Earth.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-[#22D3EE]">
              Question it.
            </span>{' '}
            Trust the answer.
          </h1>

          {/* One-line Subtext */}
          <p className="font-sans text-[17px] sm:text-[18px] leading-[1.7] text-[#C9D3EA] max-w-[60ch] mx-auto mb-10 drop-shadow">
            Upload satellite imagery, ask in plain English, and get answers with pixel-precise evidence and an honest verdict. Drishti tells you when it does not know.
          </p>

          {/* Action Row: ONE primary button + ONE subtle secondary link */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate('/chat')}
              className="px-8 py-4 rounded-[20px] text-base font-semibold text-slate-950 bg-[#22D3EE] hover:bg-[#67e8f9] shadow-[0_0_30px_rgba(34,211,238,0.45)] transition-all flex items-center justify-center gap-3 active:scale-95 group"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="relative text-sm font-medium text-slate-300 hover:text-white transition-colors group py-1"
            >
              <span>See how it works</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#22D3EE] transition-all duration-300 group-hover:w-full" />
            </button>
          </div>
        </div>

        {/* =================================================================
            CHAPTER 2: HOW IT WORKS
            Upload -> Ask -> Evidence -> Verdict in horizontal line
            ================================================================= */}
        <div
          ref={ch1Ref}
          style={{ opacity: 0, transform: 'translate3d(0, 20px, 0)', visibility: 'hidden' }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto will-change-transform"
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
          style={{ opacity: 0, transform: 'translate3d(0, 20px, 0)', visibility: 'hidden' }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto will-change-transform"
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

          {/* 3-Column Grid of Vertical Cards (matching Image 2) */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: ANSWERED */}
            <div className="light-glass-card p-6 flex flex-col justify-between border-t-2 border-t-emerald-400/60">
              <div>
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-4" strokeWidth={1.5} />
                <h3 className="font-heading font-semibold text-lg text-white/95 mb-2">
                  ANSWERED
                </h3>
                <p className="font-sans text-sm text-[#C9D3EA] leading-relaxed">
                  High-confidence pixel proof meeting strict GSD resolution and cloud cover limits.
                </p>
              </div>
            </div>

            {/* Card 2: UNCERTAIN */}
            <div className="light-glass-card p-6 flex flex-col justify-between border-t-2 border-t-amber-400/60">
              <div>
                <AlertTriangle className="w-6 h-6 text-amber-400 mb-4" strokeWidth={1.5} />
                <h3 className="font-heading font-semibold text-lg text-white/95 mb-2">
                  UNCERTAIN
                </h3>
                <p className="font-sans text-sm text-[#C9D3EA] leading-relaxed">
                  Cloud occlusion, atmospheric haze, or low sun angles prevent factual assertion.
                </p>
              </div>
            </div>

            {/* Card 3: REFUSED */}
            <div className="light-glass-card p-6 flex flex-col justify-between border-t-2 border-t-rose-400/60">
              <div>
                <XCircle className="w-6 h-6 text-rose-400 mb-4" strokeWidth={1.5} />
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
          style={{ opacity: 0, transform: 'translate3d(0, 20px, 0)', visibility: 'hidden' }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto will-change-transform"
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
                <TreePine className="w-6 h-6 text-[#22D3EE] mb-4" strokeWidth={1.5} />
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
                <Building className="w-6 h-6 text-[#22D3EE] mb-4" strokeWidth={1.5} />
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
                <Waves className="w-6 h-6 text-[#22D3EE] mb-4" strokeWidth={1.5} />
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
          style={{ opacity: 0, transform: 'translate3d(0, 20px, 0)', visibility: 'hidden' }}
          className="absolute inset-0 flex flex-col justify-between items-center px-4 max-w-4xl mx-auto pt-24 pb-8 will-change-transform"
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
