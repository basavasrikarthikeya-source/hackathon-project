import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { ScrollBackgroundVideo } from './ScrollBackgroundVideo';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TreePine,
  Building,
  Waves,
  Upload,
  MessageSquare,
  Layers,
  Sparkles,
  Satellite,
  Compass,
  Cpu,
  FileCheck
} from 'lucide-react';

interface AboutPageProps {
  onNavigate: (route: '/' | '/chat') => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { themeConfig } = useTheme();

  return (
    <div className="relative min-h-screen bg-[#05070d] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 🎬 Scroll-Bound Background Video (Synced to User Scrolling) */}
      <ScrollBackgroundVideo
        src="/assets/back.mp4"
        poster="/assets/earth-horizon.png"
        opacity={0.45}
      />

      {/* FULL-SCREEN HERO */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden satellite-grid">
        {/* Background Earth Orbit Graphic */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40 mix-blend-screen">
          <img
            src="/assets/earth-horizon.png"
            alt="Earth orbital horizon"
            className="w-full h-full object-cover object-bottom filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-[#05070d]/60 to-transparent" />
        </div>

        {/* Floating Satellite Orbit Accent */}
        <div className="absolute top-12 right-12 w-64 h-64 pointer-events-none hidden lg:block opacity-60">
          <img
            src="/assets/satellite-orbit.png"
            alt="Satellite in orbit"
            className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-pulse-slow"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center py-16 sm:py-24">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-300 uppercase tracking-widest font-semibold">
              Evidence, not guesses.
            </span>
          </div>

          {/* Name & One-Line Pitch */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            AI-Powered Satellite Imagery{' '}
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400"
              style={{
                textShadow: '0 0 30px rgba(6, 182, 212, 0.4)'
              }}
            >
              Analysis Assistant
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Upload optical or multispectral satellite images and query in plain English.
            Every answer delivers verifiable visual evidence overlays, audit checklists, and an epistemic verdict.
          </p>

          {/* Primary Action Button: "Start Analysing" */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('/chat')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.45)] transition-all flex items-center justify-center gap-3 active:scale-95 group"
            >
              <span>Start Analysing</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-6 py-4 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-white/10 backdrop-blur-md transition-colors flex items-center justify-center gap-2"
            >
              <span>Explore How It Works</span>
            </a>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-16 pt-10 border-t border-white/10 text-left">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 backdrop-blur-sm">
              <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400">0.3m</div>
              <div className="text-xs text-slate-400 mt-0.5">Native GSD Support</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 backdrop-blur-sm">
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">Pixel Visual Proof</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 backdrop-blur-sm">
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">3-Tier</div>
              <div className="text-xs text-slate-400 mt-0.5">Epistemic Verdicts</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 backdrop-blur-sm">
              <div className="text-xl sm:text-2xl font-bold font-mono text-sky-400">0 ms</div>
              <div className="text-xs text-slate-400 mt-0.5">Zero Persistent Storage</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: WHAT DRISHTI IS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-slate-950/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
              Geospatial Intelligence
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-2">
              What Drishti Is
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mt-3">
              Drishti replaces black-box hallucinations with verified, traceable satellite analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Conversational Satellite Queries
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Ask in plain English: count buildings, delineate reservoirs, or detect temporal land change without complex GIS pipelines.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Visual Evidence Overlays
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every assertion is paired with pixel-precise vector polygons and bounding boxes directly drawn over your orthomosaic.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Auditable Calibration Checks
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Sensor GSD validation, cloud mask ratios, and solar elevation corrections accompany every result in a transparent audit trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS (Upload -> Ask -> Evidence -> Verdict) */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-slate-900/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
              The 4-Step Analytical Pipeline
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-2">
              How Drishti Works
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mt-3">
              A transparent flow from raw pixels to verified decision intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Step 1: Upload */}
            <div className="relative p-5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    STEP 01
                  </span>
                  <Upload className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Upload</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ingest raster imagery via device file (PNG, JPG, GeoTIFF), paste a web URL, or connect satellite API keys (Copernicus, Planet, Maxar).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-500">
                Single or Bi-temporal Pairs
              </div>
            </div>

            {/* Step 2: Ask */}
            <div className="relative p-5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    STEP 02
                  </span>
                  <MessageSquare className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Ask</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Type questions in natural human language: counting buildings, locating water, or evaluating land alterations.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-500">
                Natural Language Parsing
              </div>
            </div>

            {/* Step 3: Evidence */}
            <div className="relative p-5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    STEP 03
                  </span>
                  <Layers className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Evidence</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Drishti draws interactive bounding boxes and pixel-precise polygon contours with instant toggle control.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-500">
                Sub-pixel Vector Proof
              </div>
            </div>

            {/* Step 4: Verdict */}
            <div className="relative p-5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    STEP 04
                  </span>
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Verdict</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every answer concludes with an audited verdict badge: ANSWERED, UNCERTAIN, or REFUSED, backed by calibration logs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-500">
                Epistemic Guardrails
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE THREE VERDICTS EXPLAINED */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-slate-950/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
              Epistemic Certainty Framework
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-2">
              The Three Verdicts Explained
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mt-3">
              Drishti never fabricates certainty. If pixels are obscured or questions exceed sensor physics, it says so immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ANSWERED */}
            <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between hover:border-emerald-400/50 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ANSWERED
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  High Confidence & Verified Pixels
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Assigned when optical GSD is sufficient (&lt;0.5m for buildings, 10m for lakes), cloud cover is nominal (&lt;5%), and model ensemble confidence exceeds 85%.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] font-mono text-emerald-300">
                Visual boxes + metrics + full audit log
              </div>
            </div>

            {/* UNCERTAIN */}
            <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col justify-between hover:border-amber-400/50 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    UNCERTAIN
                  </span>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Cloud Cover or Spatial Ambiguity
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Returned when thick cloud bands (&gt;15%), low sun-angle shadows, or atmospheric haze obscure ground features, preventing factual assertion.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] font-mono text-amber-300">
                Exact occlusion % + SAR tasking suggestion
              </div>
            </div>

            {/* REFUSED */}
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex flex-col justify-between hover:border-rose-400/50 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    REFUSED
                  </span>
                  <XCircle className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Physical Limits & Safety Policy
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Triggered if queries violate physical diffraction limits (e.g. human face recognition on 0.5m imagery) or privacy and restricted surveillance directives.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] font-mono text-rose-300">
                Policy citation + diffraction limit check
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: THREE USE CASES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
              Mission Applications
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-2">
              Three Core Use Cases
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mt-3">
              Actionable intelligence across environmental, municipal, and humanitarian domains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Use Case 1: Forest Protection */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <TreePine className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase">
                Biosphere & Ecology
              </span>
              <h3 className="text-lg font-semibold text-white mt-1 mb-2">
                Forest Protection
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Detect canopy loss, illegal logging roads, and buffer zone encroachments. Bi-temporal NDVI delta tracking flags clear-cuts before deforestation becomes irreversible.
              </p>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                NDVI Δ Indices • Ha Canopy Accounting
              </div>
            </div>

            {/* Use Case 2: Urban/Flood-Plain Growth */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-sky-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-105 transition-transform">
                <Building className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-sky-400 font-semibold uppercase">
                Municipal & Infrastructure
              </span>
              <h3 className="text-lg font-semibold text-white mt-1 mb-2">
                Urban & Flood-Plain Growth
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Count rooftop footprints, trace unpermitted sprawl along vulnerable river valleys, and quantify impermeable surface growth to prevent municipal flooding.
              </p>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                0.3m Bounding Boxes • Runoff Hazard Scores
              </div>
            </div>

            {/* Use Case 3: Disaster Response */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-cyan-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                <Waves className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-cyan-400 font-semibold uppercase">
                Crisis & Humanitarian
              </span>
              <h3 className="text-lg font-semibold text-white mt-1 mb-2">
                Disaster Response
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Rapid bi-temporal analysis of cyclone inundation, breached levees, and severed bridge crossings to guide emergency first responders with verified spatial truth.
              </p>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Swipe Slider Diff • Submerged Route Mapping
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA FOOTER BAR */}
      <section className="py-16 px-4 border-t border-white/10 bg-slate-950 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to inspect your satellite imagery?
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Launch Drishti Studio. No software to install, no GIS scripting required.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/chat')}
            className="px-8 py-3.5 rounded-xl text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all inline-flex items-center gap-2 active:scale-95"
          >
            <span>Launch Drishti Chat</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
