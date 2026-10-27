import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  MessageSquare,
  Layers,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface AboutPageProps {
  onNavigate: (route: '/' | '/chat') => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video is strictly paused (never plays autonomously)
    video.muted = true;
    video.playsInline = true;
    video.pause();

    const syncVideoToScroll = () => {
      if (!video || !video.duration || isNaN(video.duration) || !isFinite(video.duration)) {
        return;
      }
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      if (maxScroll <= 0) return;

      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      video.currentTime = progress * video.duration;
    };

    const handleLoaded = () => {
      setVideoLoaded(true);
      video.pause();
      syncVideoToScroll();
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('canplay', handleLoaded);
    video.addEventListener('loadeddata', handleLoaded);

    if (video.readyState >= 1) {
      handleLoaded();
    }

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          syncVideoToScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    syncVideoToScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('canplay', handleLoaded);
      video.removeEventListener('loadeddata', handleLoaded);
    };
  }, []);

  return (
    <div className="relative min-h-[220vh] bg-transparent text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 🎬 1. FIXED BACKGROUND VIDEO (Only for front interface, scrubs with scroll) */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <video
          ref={videoRef}
          src="/assets/back.mp4"
          poster="/assets/earth-horizon.png"
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={() => setVideoLoaded(true)}
          className="w-full h-full object-cover object-center"
          style={{ opacity: videoLoaded ? 0.85 : 0.5 }}
        />
        {/* Subtle dark gradient overlay so text stands out cleanly */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070d]/70 via-black/30 to-[#05070d]/85 pointer-events-none" />
      </div>

      {/* 🌟 THING 1: DRISHTI TITLE DISPLAYED IN THE MIDDLE */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-4">
        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/70 border border-cyan-500/30 backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-cyan-300 uppercase tracking-widest font-semibold">
            Evidence, not guesses.
          </span>
        </div>

        {/* DRISHTI Title */}
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_60px_rgba(6,182,212,0.6)] mb-6 select-none">
          DRISHTI
        </h1>

        <p className="text-base sm:text-2xl text-slate-200 max-w-xl mx-auto font-light tracking-wide leading-relaxed drop-shadow-md">
          AI-Powered Satellite & Geospatial Intelligence Assistant
        </p>

        {/* Scroll Prompt */}
        <div className="absolute bottom-12 flex flex-col items-center gap-2 text-cyan-400 animate-bounce pointer-events-none">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-300">
            Scroll to explore
          </span>
          <ChevronDown className="w-5 h-5 text-cyan-400" />
        </div>
      </section>

      {/* 📖 THING 2: WHAT DRISHTI IS (Revealed as user scrolls down) */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-4xl w-full mx-auto p-8 sm:p-12 rounded-3xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_60px_rgba(6,182,212,0.2)] text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-300 uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Geospatial Intelligence
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            What Drishti Is
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10">
            Drishti replaces black-box guesses with verified satellite analytics.
            Upload optical or multispectral imagery, ask plain-English questions, and receive
            pixel-precise visual evidence overlays and auditable epistemic verdicts.
          </p>

          {/* Core Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left mb-10">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-sm hover:border-cyan-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">
                Conversational Queries
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask in plain English: count buildings, delineate reservoirs, or track environmental changes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">
                Visual Evidence Overlays
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every assertion is paired with sub-pixel vector polygons and bounding boxes drawn over imagery.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-sm hover:border-violet-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">
                Epistemic Verdicts
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Never fabricates certainty. Outcomes are audited as ANSWERED, UNCERTAIN, or REFUSED.
              </p>
            </div>
          </div>

          {/* Action Button: Enters Chat Page */}
          <button
            type="button"
            onClick={() => onNavigate('/chat')}
            className="px-10 py-4 rounded-xl text-base font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all inline-flex items-center gap-3 active:scale-95 group"
          >
            <span>Launch Drishti Chat</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
};
